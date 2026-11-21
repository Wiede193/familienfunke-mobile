// Keep existing Expo Go / standard builds working until the native speech
// package has been installed with a verified npm lockfile.
module.exports=({config})=>{
 try{require.resolve('expo-speech-recognition/package.json');}
 catch{return config;}
 return {...config,plugins:[...(config.plugins||[]),['expo-speech-recognition',{
  microphonePermission:'Familienfunke nutzt das Mikrofon nur nach deiner Auswahl zur lokalen Spracheingabe.',
  speechRecognitionPermission:'Familienfunke benötigt die Spracherkennung für freiwillige Suchtexte.'
 }]]};
};
