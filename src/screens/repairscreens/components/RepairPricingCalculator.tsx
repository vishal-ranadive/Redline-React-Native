import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
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

// Repair data structure
const REPAIR_DATA = {
  velcro: {
    "Velcro - Sm. (1\"-2\")": 10,
    "Velcro - Md. (3\"-12\")": 20,
    "Velcro - Lg. (13\"-20\")": 40,
    "Velcro - XL (21\"-24\")": 50,
    "Velcro - XXL/Jumpsuit": 60
  },
  patches: {
    "Patch - Sm. (2\"x2\")": 29,
    "Patch - Md. (3\"x3\")": 38,
    "Patch - Lg. (4\"x4\")": 45,
    "Patch - XL (5\"x5\")": 60,
    "Patch - XXL (6\"x6\")": 70,
    "Patch - Full Pocket": 85
  },
  "reflective-trim": {
    "Reflective Trim - Sm.": 75,
    "Reflective Trim - Md.": 90,
    "Reflective Trim - Lg.": 125,
    "Reflective Trim - Pocket": 100,
    "Complete Jacket Trim": 145,
    "Complete Pants Trim": 350
  },
  zipper: {
    "Zipper Repair": 20,
    "Zipper Replacement": 48,
    "Zipper Key": 10,
    "Zipper Pull": 6
  },
  stitching: {
    "Stitching - Sm.": 15,
    "Stitching - Md.": 20,
    "Stitching - Lg.": 30
  },
  miscellaneous: {
    "Button/Snap": 10,
    "Rivet": 10,
    "D-Ring": 15,
    "Belt Loop": 10,
    "Knee Pad": 104,
    "Knee Pad Foam": 20,
    "Name Plate": 50,
    "Lettering": 10,
    "Mfr. Label (Re-Attach)": 10,
    "Postman Buckle": 10,
    "Postman Buckle Strap": 25,
    "Harness Loop Set (8-Piece)": 150,
    "Jacket Clasp": 25
  }
};

const CATEGORY_DISPLAY_NAMES = {
  velcro: 'Velcro',
  patches: 'Patches',
  'reflective-trim': 'Reflective Trim',
  zipper: 'Zipper',
  stitching: 'Stitching',
  miscellaneous: 'Miscellaneous'
};

interface RepairItem {
  name: string;
  quantity: number;
  price: string;
  originalPrice: number;
}

interface CategoryItems {
  [itemName: string]: RepairItem;
}

interface RepairPricingCalculatorProps {
  onTotalChange?: (total: number, items: RepairItem[]) => void;
  initialData?: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const RepairPricingCalculator: React.FC<RepairPricingCalculatorProps> = ({
  onTotalChange,
  initialData,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { colors } = useTheme();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categoryItems, setCategoryItems] = useState<{ [category: string]: CategoryItems }>({});
  const [itemSelectionModal, setItemSelectionModal] = useState<{
    visible: boolean;
    category: string;
    selectedItems: Set<string>;
    itemConfigs: { [itemName: string]: { quantity: number; price: string } };
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
              name: itemName,
              quantity: itemData.quantity || 1,
              price: itemData.price?.toString() || '',
              originalPrice: (REPAIR_DATA[category as keyof typeof REPAIR_DATA] as any)?.[itemName] || 0
            };
          });
        }
      });

      setSelectedCategories(newSelectedCategories);
      setCategoryItems(newCategoryItems);
    }
  }, [initialData]);

  // Calculate totals and notify parent
  const { categoryTotals, grandTotal, allItems } = useMemo(() => {
    const totals: { [category: string]: number } = {};
    let total = 0;
    const items: RepairItem[] = [];

    Object.entries(categoryItems).forEach(([category, categoryItems]) => {
      let categoryTotal = 0;
      Object.values(categoryItems).forEach(item => {
        const price = parseFloat(item.price) || 0;
        categoryTotal += price * item.quantity;
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
      newSelected.delete(category);
      const newItems = { ...categoryItems };
      delete newItems[category];
      setCategoryItems(newItems);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  const showItemSelectionModal = (category: string) => {
    const currentItems = categoryItems[category] || {};
    const selectedItems = new Set(Object.keys(currentItems));
    const itemConfigs: { [itemName: string]: { quantity: number; price: string } } = {};

    // Initialize configs for selected items
    selectedItems.forEach(itemName => {
      const existingItem = currentItems[itemName];
      itemConfigs[itemName] = {
        quantity: existingItem?.quantity || 1,
        price: existingItem?.price || ((REPAIR_DATA[category as keyof typeof REPAIR_DATA] as any)?.[itemName]?.toString() || '0')
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
    const categoryData = REPAIR_DATA[category as keyof typeof REPAIR_DATA] || {};

    const newItems: CategoryItems = { ...categoryItems[category] };

    // Add new selected items with configured values
    selectedItems.forEach(itemName => {
      const config = itemConfigs[itemName] || { quantity: 1, price: (categoryData as any)[itemName]?.toString() || '0' };
      newItems[itemName] = {
        name: itemName,
        quantity: config.quantity,
        price: config.price,
        originalPrice: (categoryData as any)[itemName] || 0
      };
    });

    // Remove unselected items
    Object.keys(newItems).forEach(itemName => {
      if (!selectedItems.has(itemName)) {
        delete newItems[itemName];
      }
    });

    setCategoryItems(prev => ({
      ...prev,
      [category]: newItems
    }));

    setItemSelectionModal({ visible: false, category: '', selectedItems: new Set(), itemConfigs: {} });
  };

  const updateItemConfig = (itemName: string, field: 'quantity' | 'price', value: string | number) => {
    setItemSelectionModal(prev => ({
      ...prev,
      itemConfigs: {
        ...prev.itemConfigs,
        [itemName]: {
          ...prev.itemConfigs[itemName] || { quantity: 1, price: (REPAIR_DATA[prev.category as keyof typeof REPAIR_DATA] as any)?.[itemName]?.toString() || '0' },
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
          price: cleanValue
        }
      }
    }));
  };

  const populatePrice = (category: string, itemName: string) => {
    const originalPrice = categoryItems[category]?.[itemName]?.originalPrice || 0;
    updatePrice(category, itemName, originalPrice.toString());
  };

  const changeQuantity = (category: string, itemName: string, delta: number) => {
    setCategoryItems(prev => {
      const newItems = { ...prev };
      const currentQuantity = newItems[category][itemName].quantity;
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
        newItems[category][itemName].quantity = newQuantity;
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
    const categories = Object.keys(REPAIR_DATA);
    const itemsPerRow = isMobile ? 2 : 3; // Keep 3 columns for portrait/tablet, 2 for mobile

    return (
      <View style={styles.categoryContainer}>

        <View style={[styles.categoryGrid, { flexDirection: 'row', flexWrap : 'wrap', }]}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                {
                //   width: `${100 / 4}%`,
                  backgroundColor: selectedCategories.has(category)
                    ? colors.primary
                    : colors.surfaceVariant
                }
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  {
                    color: selectedCategories.has(category)
                      ? colors.onPrimary
                      : colors.onSurfaceVariant
                  }
                ]}
              >
                {CATEGORY_DISPLAY_NAMES[category as keyof typeof CATEGORY_DISPLAY_NAMES]}
              </Text>
            </TouchableOpacity>
          ))}
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
                {CATEGORY_DISPLAY_NAMES[category as keyof typeof CATEGORY_DISPLAY_NAMES]}
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
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Subtotal</Text>
                  <Text style={[styles.tableHeaderTextMedium, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Actions</Text>
                </View>

                {Object.entries(items).map(([itemName, item]) => (
                  <View key={itemName} style={styles.tableRow}>
                    <Text style={[styles.tableCellWide, { color: colors.onSurface, fontSize: p(12) }]} numberOfLines={2} ellipsizeMode="tail">
                      {itemName}
                    </Text>

                    <View style={styles.tableCellMedium}>
                      <TextInput
                        value={item.price}
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
                        <Text style={[styles.quantityText, { color: colors.onSurface }]}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={[styles.quantityButton, { backgroundColor: colors.surfaceVariant }]}
                          onPress={() => changeQuantity(category, itemName, 1)}
                        >
                          <Text style={[styles.quantityButtonText, { color: colors.onSurfaceVariant }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={[styles.tableCellMedium, { color: colors.onSurface, fontSize: p(12) }]}>
                      ${(parseFloat(item.price) || 0) * item.quantity}
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
                ))}
              </View>
            </ScrollView>
          )}
        
      </Card>
    );
  };

  const renderItemSelectionModal = () => {
    const { visible, category, selectedItems, itemConfigs } = itemSelectionModal;
    const categoryData = REPAIR_DATA[category as keyof typeof REPAIR_DATA] || {};
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
                Select {CATEGORY_DISPLAY_NAMES[category as keyof typeof CATEGORY_DISPLAY_NAMES]} Items
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

                  {Object.entries(categoryData).map(([itemName, price]) => {
                    const config = itemConfigs[itemName] || { quantity: 1, price: price.toString() };
                    return (
                      <View key={itemName} style={styles.tableRow}>
                        <View style={styles.tableCellNarrow}>
                          <TouchableOpacity
                            onPress={() => {
                              const newSelected = new Set(selectedItems);
                              if (newSelected.has(itemName)) {
                                newSelected.delete(itemName);
                                // Remove config when deselected
                                const newConfigs = { ...itemConfigs };
                                delete newConfigs[itemName];
                                setItemSelectionModal(prev => ({
                                  ...prev,
                                  selectedItems: newSelected,
                                  itemConfigs: newConfigs
                                }));
                              } else {
                                newSelected.add(itemName);
                                // Initialize config when selected
                                setItemSelectionModal(prev => ({
                                  ...prev,
                                  selectedItems: newSelected,
                                  itemConfigs: {
                                    ...prev.itemConfigs,
                                    [itemName]: {
                                      quantity: 1,
                                      price: price.toString()
                                    }
                                  }
                                }));
                              }
                            }}
                          >
                            <View style={[
                              styles.checkbox,
                              {
                                backgroundColor: selectedItems.has(itemName) ? colors.primary : 'transparent',
                                borderColor: colors.outline
                              }
                            ]}>
                              {selectedItems.has(itemName) && (
                                <Text style={[styles.checkmark, { color: colors.onPrimary }]}>✓</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.tableCellWide, { color: colors.onSurface, fontSize: p(12) }]} numberOfLines={2} ellipsizeMode="tail">
                          {itemName}
                        </Text>
                        <View style={styles.tableCellMedium}>
                          <TextInput
                            value={config.price}
                            onChangeText={(value) => updateItemConfig(itemName, 'price', value)}
                            keyboardType="decimal-pad"
                            style={[styles.tableInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                            mode="outlined"
                            dense
                            left={<TextInput.Affix text="$" />}
                            disabled={!selectedItems.has(itemName)}
                          />
                        </View>
                        <View style={styles.tableCellNarrow}>
                          <TextInput
                            value={config.quantity.toString()}
                            onChangeText={(value) => updateItemConfig(itemName, 'quantity', value)}
                            keyboardType="numeric"
                            style={[styles.tableInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                            mode="outlined"
                            dense
                            disabled={!selectedItems.has(itemName)}
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
                ? `the entire ${CATEGORY_DISPLAY_NAMES[deleteDialog.category as keyof typeof CATEGORY_DISPLAY_NAMES]} category and all its items`
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
