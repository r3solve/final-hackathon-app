import { Tabs } from 'expo-router';
import { Home, Send, CreditCard, User, Shield } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarIcon: ({ color, size }) => <Send size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deposit"
        options={{
          href: null, // Hidden tab
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
    
      <Tabs.Screen
        name="payment-methods"
        options={{
          href: null, // Hidden tab
        }}
      />
      <Tabs.Screen
        name="selfie-capture"
        options={{
          href: null, // Hidden tab
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hidden tab
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hidden tab
        }}
      />
      <Tabs.Screen
        name="grouped-payments"
        options={{
          href: null, // Hidden tab
        }}
      />
     
    </Tabs>
  );
}