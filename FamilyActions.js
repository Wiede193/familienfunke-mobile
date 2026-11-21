import {Alert} from 'react-native';

// Explicit destructive actions share wording/order; callers retain ownership,
// network/error handling and any operation-specific authorization.
export function confirmRemoval({title,description,onConfirm,confirmLabel='Löschen',translate=value=>value}){
 Alert.alert(translate(title),translate(description),[
  {text:translate('Abbrechen'),style:'cancel'},
  {text:translate(confirmLabel),style:'destructive',onPress:onConfirm}
 ],{cancelable:true});
}
