import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import App from './App';
function Root(){return <SafeAreaProvider><App/></SafeAreaProvider>;}
registerRootComponent(Root);
