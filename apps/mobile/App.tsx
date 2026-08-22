import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, I18nManager } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import { colors } from './src/theme/colors';
import { TabBar, TabKey } from './src/components/TabBar';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { CreateOrderScreen } from './src/screens/CreateOrderScreen';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { CreateProductScreen } from './src/screens/CreateProductScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { CustomerDetailScreen } from './src/screens/CustomerDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type ScreenState =
  | { type: 'tabs' }
  | { type: 'order_detail'; orderId: string }
  | { type: 'create_order' }
  | { type: 'product_detail'; productId: string }
  | { type: 'create_product' }
  | { type: 'customer_detail'; customerId: string };

const MainNavigator: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabKey>('Dashboard');
  const [screenState, setScreenState] = useState<ScreenState>({ type: 'tabs' });

  // Detail navigation handlers
  const handleOpenOrderDetail = (orderId: string) => {
    setScreenState({ type: 'order_detail', orderId });
  };

  const handleOpenCreateOrder = () => {
    setScreenState({ type: 'create_order' });
  };

  const handleOpenProductDetail = (productId: string) => {
    setScreenState({ type: 'product_detail', productId });
  };

  const handleOpenCreateProduct = () => {
    setScreenState({ type: 'create_product' });
  };

  const handleOpenCustomerDetail = (customerId: string) => {
    setScreenState({ type: 'customer_detail', customerId });
  };

  const handleBackToTabs = () => {
    setScreenState({ type: 'tabs' });
  };

  const handleTabChange = (tab: TabKey) => {
    setCurrentTab(tab);
    setScreenState({ type: 'tabs' });
  };

  // Render detail / modal screen if active
  if (screenState.type === 'order_detail') {
    return (
      <OrderDetailScreen
        orderId={screenState.orderId}
        onBack={handleBackToTabs}
      />
    );
  }

  if (screenState.type === 'create_order') {
    return (
      <CreateOrderScreen
        onBack={handleBackToTabs}
        onOrderCreated={(orderId) => {
          setScreenState({ type: 'order_detail', orderId });
        }}
      />
    );
  }

  if (screenState.type === 'product_detail') {
    return (
      <ProductDetailScreen
        productId={screenState.productId}
        onBack={handleBackToTabs}
      />
    );
  }

  if (screenState.type === 'create_product') {
    return (
      <CreateProductScreen
        onBack={handleBackToTabs}
        onProductCreated={(productId) => {
          setScreenState({ type: 'product_detail', productId });
        }}
      />
    );
  }

  if (screenState.type === 'customer_detail') {
    return (
      <CustomerDetailScreen
        customerId={screenState.customerId}
        onBack={handleBackToTabs}
        onOpenOrderDetail={handleOpenOrderDetail}
      />
    );
  }

  // Render Current Tab Screen
  const renderTabContent = () => {
    switch (currentTab) {
      case 'Dashboard':
        return (
          <DashboardScreen
            onNavigateTab={handleTabChange}
            onOpenOrderDetail={handleOpenOrderDetail}
            onOpenCreateOrder={handleOpenCreateOrder}
            onOpenCreateProduct={handleOpenCreateProduct}
          />
        );
      case 'Orders':
        return (
          <OrdersScreen
            onOpenOrderDetail={handleOpenOrderDetail}
            onOpenCreateOrder={handleOpenCreateOrder}
          />
        );
      case 'Products':
        return (
          <ProductsScreen
            onOpenProductDetail={handleOpenProductDetail}
            onOpenCreateProduct={handleOpenCreateProduct}
          />
        );
      case 'Customers':
        return (
          <CustomersScreen
            onOpenCustomerDetail={handleOpenCustomerDetail}
          />
        );
      case 'Settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.appContainer}>
      <View style={styles.contentContainer}>{renderTabContent()}</View>
      <TabBar currentTab={currentTab} onSelectTab={handleTabChange} />
    </View>
  );
};

export default function App() {
  return (
    <AppProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary[900]} />
        <MainNavigator />
      </SafeAreaView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
  },
});
