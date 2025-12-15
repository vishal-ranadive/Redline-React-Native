import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import {
  Text,
  useTheme,
  IconButton,
  Surface,
} from 'react-native-paper';

// Responsive utility placeholder
const p = (size: number): number => size;

interface PaginationProps {
  page: number; // Current page (1-based)
  total: number; // Total number of items
  itemsPerPage: number; // Current items per page
  itemsPerPageList?: number[]; // Available items per page options
  onPageChange: (page: number) => void; // Callback when page changes
  onItemsPerPageChange?: (itemsPerPage: number) => void; // Callback when items per page changes
  containerStyle?: object; // Custom container style
}

/**
 * Common Pagination Component
 * Displays: << < [Page Size Dropdown] "X-Y of Z" > >>
 */
const Pagination: React.FC<PaginationProps> = ({
  page,
  total,
  itemsPerPage,
  itemsPerPageList = [10, 20, 30, 50],
  onPageChange,
  onItemsPerPageChange,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const [pageSizeMenuVisible, setPageSizeMenuVisible] = useState(false);

  // Calculate pagination values
  const totalPages = Math.ceil(total / itemsPerPage);
  const from = (page - 1) * itemsPerPage;
  const to = Math.min(page * itemsPerPage, total);

  const handlePageSizeChange = (newSize: number) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newSize);
    }
    onPageChange(1); // Reset to first page when page size changes
    setPageSizeMenuVisible(false);
  };

  if (total === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.paginationContainer,
        { backgroundColor: colors.surface, borderTopColor: colors.outline },
        containerStyle,
      ]}
    >
      <View style={styles.paginationRow}>
        {/* First Page Button << */}
        <IconButton
          icon="page-first"
          iconColor={page === 1 ? colors.outline : colors.primary}
          size={20}
          onPress={() => onPageChange(1)}
          disabled={page === 1}
          style={styles.paginationButton}
        />
        {/* Previous Page Button < */}
        <IconButton
          icon="chevron-left"
          iconColor={page === 1 ? colors.outline : colors.primary}
          size={20}
          onPress={() => page > 1 && onPageChange(page - 1)}
          disabled={page === 1}
          style={styles.paginationButton}
        />

        {/* Page Size Dropdown */}
        {onItemsPerPageChange && (
          <View>
            <TouchableOpacity
              onPress={() => setPageSizeMenuVisible(true)}
              style={[
                styles.pageSizeButton,
                { 
                  borderColor: colors.outline,
                  backgroundColor: colors.surface,
                }
              ]}
            >
              <Text style={[styles.pageSizeLabel, { color: colors.onSurface }]}>
                {itemsPerPage}
              </Text>
              <IconButton
                icon="chevron-down"
                size={16}
                iconColor={colors.onSurface}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>

            {/* Custom Dropdown Modal */}
            <Modal
              visible={pageSizeMenuVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setPageSizeMenuVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setPageSizeMenuVisible(false)}
              >
                <View style={styles.dropdownContainer}>
                  <Surface
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: colors.surface }
                    ]}
                    elevation={4}
                  >
                    <Text style={[styles.dropdownTitle, { color: colors.onSurfaceVariant }]}>
                      Items per page
                    </Text>
                    {itemsPerPageList.map((size) => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => handlePageSizeChange(size)}
                        style={[
                          styles.dropdownItem,
                          itemsPerPage === size && {
                            backgroundColor: colors.primaryContainer,
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            {
                              color: itemsPerPage === size ? colors.primary : colors.onSurface,
                              fontWeight: itemsPerPage === size ? '600' : '400',
                            }
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Surface>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}

        {/* Pagination Text */}
        <Text style={[styles.paginationText, { color: colors.onSurface }]}>
          {from + 1}-{to} of {total}
        </Text>

        {/* Next Page Button > */}
        <IconButton
          icon="chevron-right"
          iconColor={page >= totalPages ? colors.outline : colors.primary}
          size={20}
          onPress={() => page < totalPages && onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={styles.paginationButton}
        />
        {/* Last Page Button >> */}
        <IconButton
          icon="page-last"
          iconColor={page >= totalPages ? colors.outline : colors.primary}
          size={20}
          onPress={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          style={styles.paginationButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    borderTopWidth: 1,
    zIndex: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: p(8),
    paddingVertical: p(8),
    gap: p(4),
  },
  paginationButton: {
    margin: 0,
  },
  paginationText: {
    fontSize: p(14),
    fontWeight: '500',
    marginHorizontal: p(8),
  },
  pageSizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: p(4),
    minWidth: p(60),
    paddingHorizontal: p(8),
    paddingVertical: p(4),
    borderRadius: p(8),
    borderWidth: 1,
  },
  pageSizeLabel: {
    fontSize: p(14),
    fontWeight: '500',
  },
  dropdownIcon: {
    margin: 0,
    marginLeft: p(-4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    minWidth: p(160),
  },
  dropdownMenu: {
    borderRadius: p(12),
    paddingVertical: p(8),
    overflow: 'hidden',
  },
  dropdownTitle: {
    fontSize: p(12),
    fontWeight: '600',
    paddingHorizontal: p(16),
    paddingVertical: p(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    paddingHorizontal: p(16),
    paddingVertical: p(12),
  },
  dropdownItemText: {
    fontSize: p(16),
  },
});

export default Pagination;

