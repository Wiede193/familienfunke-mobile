import {Alert} from 'react-native';

// Explicit destructive actions share wording/order; callers retain ownership,
// network/error handling and any operation-specific authorization.
export function confirmRemoval({title,description,onConfirm,confirmLabel='Löschen'}){
 Alert.alert(title,description,[
  {text:'Abbrechen',style:'cancel'},
  {text:confirmLabel,style:'destructive',onPress:onConfirm}
 ],{cancelable:true});
}
