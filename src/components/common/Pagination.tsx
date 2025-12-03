import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  useTheme,
  IconButton,
  Menu,
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
          <Menu
            visible={pageSizeMenuVisible}
            onDismiss={() => setPageSizeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPageSizeMenuVisible(true)}
                style={styles.pageSizeButton}
                contentStyle={styles.pageSizeButtonContent}
                labelStyle={[styles.pageSizeLabel, { color: colors.onSurface }]}
                icon="chevron-down"
              >
                {itemsPerPage}
              </Button>
            }
            contentStyle={styles.pageSizeMenu}
          >
            {itemsPerPageList.map((size) => (
              <Menu.Item
                key={size}
                onPress={() => handlePageSizeChange(size)}
                title={size.toString()}
                titleStyle={[
                  styles.pageSizeMenuItem,
                  { color: itemsPerPage === size ? colors.primary : colors.onSurface },
                ]}
              />
            ))}
          </Menu>
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
    marginHorizontal: p(4),
    minWidth: p(60),
  },
  pageSizeButtonContent: {
    paddingHorizontal: p(8),
  },
  pageSizeLabel: {
    fontSize: p(14),
  },
  pageSizeMenu: {
    backgroundColor: 'white',
  },
  pageSizeMenuItem: {
    fontSize: p(14),
  },
});

export default Pagination;

