import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  Chip,
  IconButton,
  Card,
  Divider,
  useTheme,
  Portal,
  Dialog,
} from 'react-native-paper';
import { p } from '../../../utils/responsive';

// Import repair API
import { repairApi } from '../../../services/repairApi';

interface RepairItem {
  repair_finding_id: number;
  name: string;
  repair_quantity: number;
  repair_cost: string;
  images?: string[];
}

interface RepairFinding {
  repair_finding_id: number;
  repair_finding_name: string;
  repair_group: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
}

interface RepairGroup {
  group_name: string;
  findings: RepairFinding[];
}

interface CategoryItems {
  [repairFindingId: string]: RepairItem;
}

interface RepairPricingCalculatorProps {
  onTotalChange?: (total: number, items: RepairItem[]) => void;
  initialData?: any;
  currentRepairItems?: any;
  onRepairItemsChange?: (repairItems: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onImageSelectForItem?: (category: string, itemName: string) => void;
  onRemoveImageFromItem?: (category: string, itemName: string, imageUri: string) => void;
}

const RepairPricingCalculator: React.FC<RepairPricingCalculatorProps> = ({
  onTotalChange,
  initialData,
  currentRepairItems,
  onRepairItemsChange,
  isCollapsed = false,
  onToggleCollapse,
  onImageSelectForItem,
  onRemoveImageFromItem
}) => {
  const { colors } = useTheme();

  // Repair findings data from API
  const [repairGroups, setRepairGroups] = useState<RepairGroup[]>([]);
  const [repairDataLoading, setRepairDataLoading] = useState(true);
  const [repairDataError, setRepairDataError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categoryItems, setCategoryItems] = useState<{ [category: string]: CategoryItems }>({});
  const [itemSelectionModal, setItemSelectionModal] = useState<{
    visible: boolean;
    category: string;
    selectedItems: Set<string>;
    itemConfigs: { [itemId: string]: { quantity: number; price: string; images: string[] } };
  }>({
    visible: false,
    category: '',
    selectedItems: new Set(),
    itemConfigs: {}
  });

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    visible: boolean;
    type: 'category' | 'item';
    category: string;
    itemName?: string;
  }>({
    visible: false,
    type: 'category',
    category: ''
  });

  // Category collapse state
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 1024;

  // Modal orientation lock - force portrait
  const [modalSupportedOrientations, setModalSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'portrait-upside-down']);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  // Fetch repair findings data
  useEffect(() => {
    const fetchRepairFindings = async () => {
      try {
        setRepairDataLoading(true);
        setRepairDataError(null);

        const response = await repairApi.getRepairFindings();

        if (response.status === true) {
          setRepairGroups(response.repair_group || []);
        } else {
          setRepairDataError('Failed to load repair findings');
        }
      } catch (error) {
        console.error('Error fetching repair findings:', error);
        setRepairDataError('Error loading repair findings');
      } finally {
        setRepairDataLoading(false);
      }
    };

    fetchRepairFindings();
  }, []);

  // Lock modal to portrait when it opens
  useEffect(() => {
    if (itemSelectionModal.visible) {
      // Force portrait orientation when modal opens
      setModalSupportedOrientations(['portrait', 'portrait-upside-down']);
    }
  }, [itemSelectionModal.visible]);

  // Initialize with existing data if provided
  useEffect(() => {
    if (initialData && initialData.repair_items) {
      const items = initialData.repair_items;
      const newCategoryItems: { [category: string]: CategoryItems } = {};
      const newSelectedCategories = new Set<string>();

      Object.entries(items).forEach(([category, categoryData]: [string, any]) => {
        if (categoryData && typeof categoryData === 'object') {
          newSelectedCategories.add(category);
          newCategoryItems[category] = {};

          Object.entries(categoryData).forEach(([itemName, itemData]: [string, any]) => {
            newCategoryItems[category][itemName] = {
              repair_finding_id: itemData.repair_finding_id || 0,
              name: itemName,
              repair_quantity: itemData.repair_quantity || itemData.quantity || 1,
              repair_cost: itemData.repair_cost || itemData.price?.toString() || '',
              images: itemData.images || []
            };
          });
        }
      });

      setSelectedCategories(newSelectedCategories);
      setCategoryItems(newCategoryItems);
    }
  }, [initialData]);

  // Update categoryItems when currentRepairItems changes (for external image updates only)
  // This should only run when external changes happen, not from our own callbacks
  useEffect(() => {
    if (currentRepairItems && Object.keys(currentRepairItems).length > 0) {
      console.log('🔄 External update: currentRepairItems changed, updating categoryItems');

      // Only update if this is different from our current state to avoid loops
      let hasChanges = false;
      const newCategoryItems: { [category: string]: CategoryItems } = { ...categoryItems };

      Object.entries(currentRepairItems).forEach(([category, categoryData]: [string, any]) => {
        if (categoryData && typeof categoryData === 'object') {
          if (!newCategoryItems[category]) {
            newCategoryItems[category] = {};
            hasChanges = true;
          }

          Object.entries(categoryData).forEach(([itemName, itemData]: [string, any]) => {
            const existingItem = newCategoryItems[category]?.[itemName];
            const currentImages = existingItem?.images || [];
            const newImages = itemData.images || [];

            // Ensure the item exists in categoryItems (even if images haven't changed)
            if (!existingItem) {
              newCategoryItems[category][itemName] = {
                repair_finding_id: parseInt(itemName) || itemData.repair_finding_id || 0,
                name: itemData.name || itemName,
                repair_quantity: itemData.repair_quantity || itemData.quantity || 1,
                repair_cost: itemData.repair_cost || itemData.price?.toString() || '',
                images: newImages
              };
              hasChanges = true;
              console.log('🔄 Added missing item:', category, itemName);
            } else {
              // Only update if images have changed (external image assignment)
              if (JSON.stringify(currentImages) !== JSON.stringify(newImages)) {
                newCategoryItems[category][itemName].images = newImages;
                hasChanges = true;
                console.log('🔄 Updated images for item:', category, itemName);
              }
            }
          });
        }
      });

      if (hasChanges) {
        console.log('🔄 Applying external changes to categoryItems');
        setCategoryItems(newCategoryItems);
      }
    }
  }, [currentRepairItems]);

  // Calculate totals and notify parent
  const { categoryTotals, grandTotal, allItems } = useMemo(() => {
    const totals: { [category: string]: number } = {};
    let total = 0;
    const items: RepairItem[] = [];

    Object.entries(categoryItems).forEach(([category, categoryItems]) => {
      let categoryTotal = 0;
      Object.values(categoryItems).forEach(item => {
        const price = parseFloat(item.repair_cost) || 0;
        categoryTotal += price * item.repair_quantity;
        items.push(item);
      });
      totals[category] = categoryTotal;
      total += categoryTotal;
    });

    return { categoryTotals: totals, grandTotal: total, allItems: items };
  }, [categoryItems]);

  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(grandTotal, allItems);
    }
  }, [grandTotal, allItems, onTotalChange]);

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      // Category is already selected - handle deselection
      // Check if category has any items before allowing deselection
      const categoryItemsCount = categoryItems[category] ? Object.keys(categoryItems[category]).length : 0;
      if (categoryItemsCount > 0) {
        // Show confirmation dialog if category has items
        setDeleteDialog({
          visible: true,
          type: 'category',
          category
        });
        return;
      }
      // If no items, proceed with deselection
      newSelected.delete(category);
      const newItems = { ...categoryItems };
      delete newItems[category];
      setCategoryItems(newItems);
      setSelectedCategories(newSelected);
    } else {
      // Category is NOT selected - first time selecting
      // Add to selected categories
      newSelected.add(category);
      setSelectedCategories(newSelected);
      // Automatically open the add repair item modal for this category
      showItemSelectionModal(category);
    }
  };

  const showItemSelectionModal = (category: string) => {
    const currentItems = categoryItems[category] || {};
    const selectedItems = new Set(Object.keys(currentItems));
    const itemConfigs: { [itemId: string]: { quantity: number; price: string; images: string[] } } = {};

    // Initialize configs for selected items
    selectedItems.forEach(itemId => {
      const existingItem = currentItems[itemId];
      itemConfigs[itemId] = {
        quantity: existingItem?.repair_quantity || 1,
        price: existingItem?.repair_cost || '0',
        images: existingItem?.images || []
      };
    });

    setItemSelectionModal({
      visible: true,
      category,
      selectedItems,
      itemConfigs
    });
  };

  const addSelectedItems = () => {
    const { category, selectedItems, itemConfigs } = itemSelectionModal;
    const groupData = repairGroups.find(group => group.group_name.toLowerCase().replace(/\s+/g, '-') === category);

    const newItems: CategoryItems = { ...categoryItems[category] };

    // Add new selected items with configured values
    selectedItems.forEach(itemId => {
      const config = itemConfigs[itemId] || { quantity: 1, price: '0', images: [] };
      const finding = groupData?.findings.find(f => f.repair_finding_id.toString() === itemId);

      newItems[itemId] = {
        repair_finding_id: parseInt(itemId),
        name: finding?.repair_finding_name || itemId,
        repair_quantity: config.quantity,
        repair_cost: config.price,
        images: config.images
      };
    });

    // Remove unselected items
    Object.keys(newItems).forEach(itemId => {
      if (!selectedItems.has(itemId)) {
        delete newItems[itemId];
      }
    });

    setCategoryItems(prev => {
      const updatedCategoryItems = {
        ...prev,
        [category]: newItems
      };
      // Notify parent of repair items change
      if (onRepairItemsChange) {
        setTimeout(() => onRepairItemsChange(updatedCategoryItems), 0);
      }
      return updatedCategoryItems;
    });

    setItemSelectionModal({ visible: false, category: '', selectedItems: new Set(), itemConfigs: {} });
  };

  const updateItemConfig = (itemName: string, field: 'quantity' | 'price', value: string | number) => {
    setItemSelectionModal(prev => ({
      ...prev,
      itemConfigs: {
        ...prev.itemConfigs,
        [itemName]: {
          ...prev.itemConfigs[itemName] || { quantity: 1, price: '0' },
          [field]: field === 'quantity' ? Math.max(1, Number(value) || 1) : value
        }
      }
    }));
  };

  const updatePrice = (category: string, itemName: string, value: string) => {
    // Allow empty values and filter invalid characters
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(cleanValue);

    // Prevent negative values
    if (cleanValue !== '' && (isNaN(numericValue) || numericValue < 0)) {
      return;
    }

    setCategoryItems(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [itemName]: {
          ...prev[category][itemName],
          repair_cost: cleanValue
        }
      }
    }));
  };

  const populatePrice = (category: string, itemName: string) => {
    // No original prices available, do nothing
    return;
  };

  const changeQuantity = (category: string, itemName: string, delta: number) => {
    setCategoryItems(prev => {
      const newItems = { ...prev };
      const currentQuantity = newItems[category][itemName].repair_quantity;
      const newQuantity = Math.max(0, currentQuantity + delta);

      if (newQuantity === 0) {
        // Remove item if quantity becomes 0
        delete newItems[category][itemName];
        if (Object.keys(newItems[category]).length === 0) {
          delete newItems[category];
          setSelectedCategories(prevCats => {
            const newCats = new Set(prevCats);
            newCats.delete(category);
            return newCats;
          });
        }
      } else {
        newItems[category][itemName].repair_quantity = newQuantity;
      }

      // Notify parent of repair items change when items are removed
      if (newQuantity === 0 && onRepairItemsChange) {
        setTimeout(() => onRepairItemsChange(newItems), 0);
      }

      return newItems;
    });
  };

  const removeItem = (category: string, itemName: string) => {
    setDeleteDialog({
      visible: true,
      type: 'item',
      category,
      itemName
    });
  };

  const confirmDeleteItem = () => {
    const { category, itemName } = deleteDialog;
    if (!itemName) return;

    setCategoryItems(prev => {
      const newItems = { ...prev };
      delete newItems[category][itemName];

      if (Object.keys(newItems[category]).length === 0) {
        delete newItems[category];
        setSelectedCategories(prevCats => {
          const newCats = new Set(prevCats);
          newCats.delete(category);
          return newCats;
        });
      }

      // Notify parent of repair items change
      if (onRepairItemsChange) {
        setTimeout(() => onRepairItemsChange(newItems), 0);
      }

      return newItems;
    });

    setDeleteDialog({ visible: false, type: 'category', category: '' });
  };

  const removeCategory = (category: string) => {
    setDeleteDialog({
      visible: true,
      type: 'category',
      category
    });
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(category)) {
        newCollapsed.delete(category);
      } else {
        newCollapsed.add(category);
      }
      return newCollapsed;
    });
  };

  const confirmDeleteCategory = () => {
    const { category } = deleteDialog;

    setCategoryItems(prev => {
      const newItems = { ...prev };
      delete newItems[category];

      // Notify parent of repair items change
      if (onRepairItemsChange) {
        setTimeout(() => onRepairItemsChange(newItems), 0);
      }

      return newItems;
    });

    setSelectedCategories(prevCats => {
      const newCats = new Set(prevCats);
      newCats.delete(category);
      return newCats;
    });

    setDeleteDialog({ visible: false, type: 'category', category: '' });
  };

  const renderCategoryGrid = () => {
    if (repairDataLoading) {
      return (
        <View style={styles.categoryContainer}>
          <View style={styles.loadingContainer}>
            <Text style={{ color: colors.onSurfaceVariant }}>Loading repair categories...</Text>
          </View>
        </View>
      );
    }

    if (repairDataError) {
      return (
        <View style={styles.categoryContainer}>
          <View style={styles.errorContainer}>
            <Text style={{ color: colors.error }}>{repairDataError}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.categoryContainer}>
        <View style={[styles.categoryGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {repairGroups.map((group) => {
            const categoryKey = group.group_name.toLowerCase().replace(/\s+/g, '-');
            const isSelected = selectedCategories.has(categoryKey);
            return (
              <TouchableOpacity
                key={categoryKey}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surfaceVariant
                  }
                ]}
                onPress={() => toggleCategory(categoryKey)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    {
                      color: isSelected
                        ? colors.onPrimary
                        : colors.onSurfaceVariant
                    }
                  ]}
                >
                  {group.group_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderCategorySection = (category: string) => {
    const items = categoryItems[category] || {};
    const categoryTotal = categoryTotals[category] || 0;
    const itemCount = Object.keys(items).length;
    const isCollapsed = collapsedCategories.has(category);

    return (
      <Card key={category} style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
        
          <TouchableOpacity
            style={styles.categoryHeader}
            onPress={() => toggleCategoryCollapse(category)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryTitleContainer}>
              <IconButton
                icon={isCollapsed ? "chevron-right" : "chevron-down"}
                size={20}
                iconColor={colors.onSurfaceVariant}
                style={{ margin: 0, marginRight: p(4) }}
              />
              <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
                {repairGroups.find(group => group.group_name.toLowerCase().replace(/\s+/g, '-') === category)?.group_name || category}
              </Text>
              <Text style={[styles.categoryTotalText, { color: colors.primary }]}>
                ${categoryTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.categoryActions}>
              <Button
                mode="outlined"
                onPress={() => showItemSelectionModal(category)}
                style={styles.addButton}
                labelStyle={{ fontSize: p(11) }}
              >
                {isMobile ? '+' : '+ Add repair item'}
              </Button>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => removeCategory(category)}
                iconColor={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {!isCollapsed && Object.keys(items).length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderTextWide, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Item ({itemCount})</Text>
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Price</Text>
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Qty</Text>
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Images</Text>
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Subtotal</Text>
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Actions</Text>
                </View>

                {Object.entries(items).map(([itemName, item]) => (
                  <View key={itemName}>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCellWide, { color: colors.onSurface, fontSize: p(12) }]} numberOfLines={2} ellipsizeMode="tail">
                          {item.name}
                        </Text>

                      <View style={styles.tableCellMedium}>
                        <TextInput
                          value={item.repair_cost}
                          onChangeText={(value) => updatePrice(category, itemName, value)}
                          placeholder="0.00"
                          keyboardType="decimal-pad"
                          style={[styles.priceInput, { backgroundColor: colors.surfaceVariant }]}
                          mode="outlined"
                          dense
                        />
                      </View>

                      <View style={styles.tableCellMedium}>
                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            style={[styles.quantityButton, { backgroundColor: colors.surfaceVariant }]}
                            onPress={() => changeQuantity(category, itemName, -1)}
                          >
                            <Text style={[styles.quantityButtonText, { color: colors.onSurfaceVariant }]}>-</Text>
                          </TouchableOpacity>
                          <Text style={[styles.quantityText, { color: colors.onSurface }]}>{item.repair_quantity}</Text>
                          <TouchableOpacity
                            style={[styles.quantityButton, { backgroundColor: colors.surfaceVariant }]}
                            onPress={() => changeQuantity(category, itemName, 1)}
                          >
                            <Text style={[styles.quantityButtonText, { color: colors.onSurfaceVariant }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.tableCellMedium}>
                        <TouchableOpacity
                          style={[styles.imageButton, { backgroundColor: colors.surfaceVariant }]}
                          onPress={() => onImageSelectForItem && onImageSelectForItem(category, itemName)}
                        >
                          <Text style={[styles.imageButtonText, { color: colors.onSurfaceVariant }]}>
                            {item.images?.length || 0} 📷
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.tableCellMedium, { color: colors.onSurface, fontSize: p(12) }]}>
                        ${(parseFloat(item.repair_cost) || 0) * item.repair_quantity}
                      </Text>

                      <View style={styles.tableCellMedium}>
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeItem(category, itemName)}
                          iconColor={colors.primary}
                        />
                      </View>
                    </View>

                    {/* Images display for this specific repair item */}
                    {item.images && item.images.length > 0 && (
                      <View style={styles.itemImagesRow}>
                        <View style={styles.itemImagesGrid}>
                          {item.images.map((imageUri: string, imgIndex: number) => {
                            console.log('🎨 Rendering image:', imageUri, 'for item:', itemName);
                            return (
                              <View key={`${itemName}-img-${imgIndex}`} style={styles.itemImageWrapper}>
                                <TouchableOpacity
                                  style={styles.itemImageContainer}
                                  onPress={() => {/* TODO: Open image preview */}}
                                >
                                  <Image
                                    source={{ uri: imageUri }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.removeItemImageButton, { backgroundColor: colors.error }]}
                                  onPress={() => onRemoveImageFromItem && onRemoveImageFromItem(category, itemName, imageUri)}
                                >
                                  <Text style={styles.removeItemImageText}>×</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                ))}


              </View>
              {/* TODO: add images display for each repair item */}
              
            </ScrollView>
          )}

      </Card>
    );
  };

  const renderItemSelectionModal = () => {
    const { visible, category, selectedItems, itemConfigs } = itemSelectionModal;
    const groupData = repairGroups.find(group => group.group_name.toLowerCase().replace(/\s+/g, '-') === category);
    const selectedItemsArray = Array.from(selectedItems);

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setItemSelectionModal({ visible: false, category: '', selectedItems: new Set(), itemConfigs: {} })}
        supportedOrientations={modalSupportedOrientations}
      >
        <SafeAreaView style={[styles.statusModalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[
            styles.statusModalContainer,
            {
              backgroundColor: colors.surface,
              maxWidth: isTablet ? p(600) : '95%',
              maxHeight: isTablet ? p(700) : '85%',
              height: isTablet ? p(700) : '85%',
            }
          ]}>
            {/* Modal Header */}
            <View style={[
              styles.statusModalHeader,
              { borderBottomColor: colors.outline }
            ]}>
              <Text style={[
                styles.statusModalTitle,
                { color: colors.onSurface, fontSize: p(18) }
              ]}>
                Select {groupData?.group_name || category} Items
              </Text>
              <Button
                mode="text"
                compact
                onPress={() => setItemSelectionModal({ visible: false, category: '', selectedItems: new Set(), itemConfigs: {} })}
                contentStyle={{ padding: 0 }}
              >
                <IconButton
                  icon="close"
                  size={p(24)}
                  iconColor={colors.onSurface}
                />
              </Button>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.statusModalContent} showsVerticalScrollIndicator={true}>
              {/* Available Items Section */}
              {/* <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(16), marginBottom: p(8) }]}>
                Available Items
              </Text> */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
                <View style={styles.tableWrapper}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderTextNarrow, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Select</Text>
                    <Text style={[styles.tableHeaderTextWide, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Item</Text>
                    <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Price</Text>
                    <Text style={[styles.tableHeaderTextNarrow, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Qty</Text>
                  </View>

                  {groupData?.findings.map((finding) => {
                    const itemId = finding.repair_finding_id.toString();
                    const config = itemConfigs[itemId] || { quantity: 1, price: '0', images: [] };
                    return (
                      <View key={itemId} style={styles.tableRow}>
                        <View style={styles.tableCellNarrow}>
                          <TouchableOpacity
                            onPress={() => {
                              const newSelected = new Set(selectedItems);
                              if (newSelected.has(itemId)) {
                                newSelected.delete(itemId);
                                // Remove config when deselected
                                const newConfigs = { ...itemConfigs };
                                delete newConfigs[itemId];
                                setItemSelectionModal(prev => ({
                                  ...prev,
                                  selectedItems: newSelected,
                                  itemConfigs: newConfigs
                                }));
                              } else {
                                newSelected.add(itemId);
                                // Initialize config when selected
                                setItemSelectionModal(prev => ({
                                  ...prev,
                                  selectedItems: newSelected,
                                  itemConfigs: {
                                    ...prev.itemConfigs,
                                    [itemId]: {
                                      quantity: 1,
                                      price: '0',
                                      images: []
                                    }
                                  }
                                }));
                              }
                            }}
                          >
                            <View style={[
                              styles.checkbox,
                              {
                                backgroundColor: selectedItems.has(itemId) ? colors.primary : 'transparent',
                                borderColor: colors.outline
                              }
                            ]}>
                              {selectedItems.has(itemId) && (
                                <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.tableCellWide, { color: colors.onSurface, fontSize: p(12) }]} numberOfLines={2} ellipsizeMode="tail">
                          {finding.repair_finding_name}
                        </Text>
                        <View style={styles.tableCellMedium}>
                          <TextInput
                            value={config.price}
                            onChangeText={(value) => updateItemConfig(itemId, 'price', value)}
                            keyboardType="decimal-pad"
                            style={[styles.tableInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                            mode="outlined"
                            dense
                            left={<TextInput.Affix text="$" />}
                            disabled={!selectedItems.has(itemId)}
                          />
                        </View>
                        <View style={styles.tableCellNarrow}>
                          <TextInput
                            value={config.quantity.toString()}
                            onChangeText={(value) => updateItemConfig(itemId, 'quantity', value)}
                            keyboardType="numeric"
                            style={[styles.tableInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                            mode="outlined"
                            dense
                            disabled={!selectedItems.has(itemId)}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>


            </ScrollView>

            {/* Modal Footer */}
            <View style={[
              styles.statusModalFooter,
              { borderTopColor: colors.outline }
            ]}>
              <Button
                mode="outlined"
                onPress={() => setItemSelectionModal({ visible: false, category: '', selectedItems: new Set(), itemConfigs: {} })}
                style={styles.statusModalCancelButton}
                labelStyle={{ fontSize: p(14) }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={addSelectedItems}
                disabled={selectedItemsArray.length === 0}
                labelStyle={{ fontSize: p(14) }}
              >
                Add Selected ({selectedItemsArray.length})
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderTotals = () => {
    if (grandTotal === 0) return null;

    return (
      <Card style={[styles.totalsCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.totalsContent}>
            <Text style={[styles.grandTotalText, { color: colors.primary }]}>
              Grand Total: ${grandTotal.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.collapseHeader, { backgroundColor: colors.surface }]}
        onPress={onToggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.collapseHeaderContent}>
          <Text style={[styles.collapseHeaderTitle, { color: colors.onSurface }]}>
            Repair Items & Pricing
          </Text>
          <View style={styles.collapseHeaderRight}>
            {selectedCategories.size > 0 && (
              <Text style={[styles.collapseHeaderTotal, { color: colors.primary }]}>
                Total: ${grandTotal.toFixed(2)}
              </Text>
            )}
            <IconButton
              icon={isCollapsed ? "chevron-down" : "chevron-up"}
              size={24}
              iconColor={colors.onSurfaceVariant}
            />
          </View>
        </View>
      </TouchableOpacity>

      {!isCollapsed && (
        <>
          {renderCategoryGrid()}

          <ScrollView showsVerticalScrollIndicator={false}>
            {Array.from(selectedCategories).map(category => renderCategorySection(category))}
            {renderTotals()}
          </ScrollView>
        </>
      )}

      {renderItemSelectionModal()}

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialog.visible}
          onDismiss={() => setDeleteDialog({ visible: false, type: 'category', category: '' })}
        >
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete{' '}
              {deleteDialog.type === 'category'
                ? `the entire ${repairGroups.find(group => group.group_name.toLowerCase().replace(/\s+/g, '-') === deleteDialog.category)?.group_name || deleteDialog.category} category and all its items`
                : `the item "${deleteDialog.itemName}"`
              }?
            </Text>
            <Text style={{ marginTop: 8, color: colors.error }}>
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog({ visible: false, type: 'category', category: '' })}>
              Cancel
            </Button>
            <Button
              onPress={deleteDialog.type === 'category' ? confirmDeleteCategory : confirmDeleteItem}
              textColor={colors.primary}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  collapseHeader: {
    borderRadius: 12,
    // marginHorizontal: p(14),
    marginBottom: p(12),
    // elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collapseHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // padding: p(2),
    // paddingHorizontal: p(0),
  },
  collapseHeaderTitle: {
    fontSize: p(14),
    fontWeight: '700',
  },
  collapseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  collapseHeaderTotal: {
    fontSize: p(16),
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: p(16),
  },
  sectionTitle: {
    fontSize: p(18),
    fontWeight: '700',
    marginBottom: p(12),
    paddingHorizontal: p(14),
  },
  categoryGrid: {
    paddingHorizontal: p(2),
  },
  categoryButton: {
    padding: p(12),
    margin: p(4),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    fontSize: p(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: p(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: p(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCard: {
    marginHorizontal: p(0),
    paddingHorizontal: p(0),
    paddingVertical: p(1),
    marginBottom: p(2),
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  categoryTitle: {
    fontSize: p(16),
    fontWeight: '700',
  },
  categoryTotalText: {
    fontSize: p(16),
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  addButton: {
    // height: p(32),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: p(28),
    height: p(28),
    borderRadius: p(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: p(16),
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: p(14),
    fontWeight: '600',
    marginHorizontal: p(12),
    minWidth: p(20),
    textAlign: 'center',
  },
  priceInput: {
    height: p(36),
  },
  imageButton: {
    padding: p(8),
    borderRadius: p(4),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: p(32),
  },
  imageButtonText: {
    fontSize: p(12),
    fontWeight: '500',
  },
  itemImagesRow: {
    paddingHorizontal: p(8),
    paddingVertical: p(8),
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(8),
  },
  itemImageWrapper: {
    position: 'relative',
    width: p(60),
    height: p(60),
  },
  itemImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: p(6),
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: p(6),
  },
  removeItemImageButton: {
    position: 'absolute',
    top: -p(6),
    right: -p(6),
    width: p(20),
    height: p(20),
    borderRadius: p(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeItemImageText: {
    color: '#fff',
    fontSize: p(14),
    fontWeight: 'bold',
  },
  totalsCard: {
    marginHorizontal: p(14),
    marginBottom: p(20),
    borderRadius: 12,
  },
  totalsContent: {
    alignItems: 'center',
  },
  grandTotalText: {
    fontSize: p(20),
    fontWeight: 'bold',
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: p(20),
  },
  modalTitle: {
    fontSize: p(18),
    fontWeight: '700',
    marginBottom: p(16),
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: p(300),
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: p(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: p(24),
    height: p(24),
    borderRadius: p(4),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: p(12),
  },
  checkmark: {
    fontSize: p(16),
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameText: {
    fontSize: p(14),
    fontWeight: '500',
  },
  itemPriceText: {
    fontSize: p(12),
    marginTop: p(2),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: p(20),
  },
  statusModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModalContainer: {
    width: '90%',
    borderRadius: p(16),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: p(20),
    paddingVertical: p(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusModalTitle: {
    fontSize: p(20),
    fontWeight: '700',
    flex: 1,
  },
  statusModalContent: {
    paddingVertical: p(16),
  },
  statusModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: p(20),
    paddingVertical: p(16),
    gap: p(8),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusModalCancelButton: {
    minWidth: p(100),
  },
  resetPriceButton: {
    margin: 0,
  },
  tableScrollContainer: {
    paddingBottom: p(8),
  },
  tableWrapper: {
    minWidth: p(700), // Ensure proper table width
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: p(8),
  },
  // Fixed width for specific columns
  tableHeaderTextMedium: {
    width: p(100),
    paddingHorizontal: p(8),
    fontWeight: '600',
    textAlign: 'left',
  },
  tableHeaderTextWide: {
    width: p(150),
    paddingHorizontal: p(8),
    fontWeight: '600',
    textAlign: 'left',
  },
  tableHeaderTextNarrow: {
    width: p(80),
    paddingHorizontal: p(8),
    fontWeight: '600',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: p(8),
  },
  // Fixed width for specific columns
  tableCellMedium: {
    width: p(100),
    paddingHorizontal: p(8),
    textAlign: 'left',
  },
  tableCellWide: {
    width: p(150),
    paddingHorizontal: p(8),
    textAlign: 'left',
  },
  tableCellNarrow: {
    width: p(80),
    paddingHorizontal: p(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableInput: {
    width: '100%',
    fontSize: p(12),
  },
  configItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: p(12),
    paddingHorizontal: p(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configItemName: {
    flex: 1.5,
    fontSize: p(14),
    fontWeight: '500',
  },
  configInputs: {
    flex: 2,
    flexDirection: 'row',
    gap: p(8),
  },
  quantityConfig: {
    flex: 1,
  },
  priceConfig: {
    flex: 1,
  },
  configLabel: {
    fontSize: p(12),
    marginBottom: p(4),
  },
  configInput: {
    height: p(36),
  },
});

export default RepairPricingCalculator;
