// The standard build must neither install nor request microphone access.
// When the optional native speech dependency is installed, image-picker's
// explicit permission block must be removed BEFORE Expo applies its plugins.
module.exports=({config})=>{
 try{require.resolve('expo-speech-recognition/package.json');}
 catch{return config;}
 const microphonePermission='Familienfunke nutzt das Mikrofon nur nach deiner Auswahl zur lokalen Spracheingabe.';
 const speechRecognitionPermission='Familienfunke benötigt die Spracherkennung für freiwillige Suchtexte.';
 const permission='android.permission.RECORD_AUDIO';
 const plugins=(config.plugins||[]).map(plugin=>{
  if(Array.isArray(plugin)&&plugin[0]==='expo-image-picker'){
   return [plugin[0],{...plugin[1],microphonePermission}];
  }
  return plugin;
 });
 return {...config,android:{...config.android,
  permissions:[...new Set([...(config.android?.permissions||[]),permission])],
  blockedPermissions:(config.android?.blockedPermissions||[]).filter(x=>x!==permission)
 },plugins:[...plugins,['expo-speech-recognition',{microphonePermission,speechRecognitionPermission}]]};
};
