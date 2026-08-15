import * as NavigationBar from 'expo-navigation-bar';
import React, {useEffect} from 'react';
import Rotas from './src/routes';
import { LogBox } from "react-native";
import { StatusBar } from 'expo-status-bar';



export default function App() {
  LogBox.ignoreLogs([
  "VirtualizedLists should never be nested",
]);
  useEffect(() => {
  const prepararTela = async () => {

    await NavigationBar.setVisibilityAsync("visible");



  };
  
  prepararTela();
}, []);
  return (
    <>
    <StatusBar
        hidden={true}
      />
      <Rotas/>
    </>
  );
}

