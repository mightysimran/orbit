import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Import Auth Screens
import SplashScreen from "./app/screens/auth/SplashScreen";
import LoginScreen from "./app/screens/auth/LoginScreen";
import RegisterScreen from "./app/screens/auth/RegisterScreen";
import ReuploadIdScreen from "./app/screens/auth/ReuploadIdScreen";

// Import Shared Screens
import PendingVerificationScreen from "./app/screens/shared/PendingVerificationScreen";
import HomeDashboard from "./app/screens/shared/HomeDashboard";

import BookRideScreen from "./app/screens/rider/BookRideScreen";
import FindingDriverScreen from "./app/screens/rider/FindingDriverScreen";
import LiveTrackingScreen from "./app/screens/rider/LiveTrackingScreen";
import RideCompleteScreen from "./app/screens/rider/RideCompleteScreen";
import RideHistoryScreen from "./app/screens/rider/RideHistoryScreen";

import DriverDashboard from "./app/screens/driver/DriverDashboard";
import IncomingRequestScreen from "./app/screens/driver/IncomingRequestScreen";
import ActiveRideScreen from "./app/screens/driver/ActiveRideScreen";
import EarningsScreen from "./app/screens/driver/EarningsScreen";
import DriverRegistrationScreen from "./app/screens/driver/DriverRegistrationScreen";

import ProfileScreen from "./app/screens/shared/ProfileScreen";

import MapScreen from "./app/screens/rider/MapScreen";
import SearchingScreen from "./app/screens/rider/SearchingScreen";

const Stack = createStackNavigator();

import { View, Text } from "react-native";

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="PendingVerification"
          component={PendingVerificationScreen}
        />
        {/* Notice how we are now using the real HomeDashboard component here */}
        <Stack.Screen name="ReuploadIdScreen" component={ReuploadIdScreen} />
        <Stack.Screen name="HomeDashboard" component={HomeDashboard} />
        <Stack.Screen name="BookRideScreen" component={BookRideScreen} />
        <Stack.Screen
          name="FindingDriverScreen"
          component={FindingDriverScreen}
        />
        <Stack.Screen
          name="LiveTrackingScreen"
          component={LiveTrackingScreen}
        />
        <Stack.Screen
          name="RideCompleteScreen"
          component={RideCompleteScreen}
        />
        <Stack.Screen name="RideHistoryScreen" component={RideHistoryScreen} />
        <Stack.Screen
          name="DriverRegistrationScreen"
          component={DriverRegistrationScreen}
        />
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
        <Stack.Screen
          name="IncomingRequestScreen"
          component={IncomingRequestScreen}
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="ActiveRideScreen"
          component={ActiveRideScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="EarningsScreen" component={EarningsScreen} />

        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />

        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="SearchingScreen" component={SearchingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
