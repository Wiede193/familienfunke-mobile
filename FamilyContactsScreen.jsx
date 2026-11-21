import React from 'react';
import {ScrollView,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {styles} from './FamilyAppStyles';
import {Button,Card,H,Avatar,Row,Blank} from './FamilyUI';
import FamilyActionButton from './FamilyActionButton';

export default function ContactsScreen({focusId,pending,accepted,me,nameOf,respond,blocked,disabled,onBlock,onUnblock,onChat}){
pending=[...pending].sort((a,b)=>Number(b.id===focusId)-Number(a.id===focusId));
accepted=[...accepted].sort((a,b)=>Number(b.id===focusId)-Number(a.id===focusId));
const other=c=>c.sender_id===me?c.recipient_id:c.sender_id;
return <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
<H sub="Nachrichten sind erst nach gegenseitiger Bestätigung möglich.">Deine Kontakte</H>
<Text style={styles.sectionTitle}>Offene Anfragen</Text>
{pending.length===0?<Blank title="Keine offenen Anfragen" body="Neue Kontaktwünsche erscheinen hier."/>:pending.map(c=><Card key={c.id} style={{marginBottom:10,borderColor:c.id===focusId?C.accent:C.line,borderWidth:c.id===focusId?2:1}}>
<Row><Avatar name={nameOf(other(c))}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(other(c))}</Text><Text style={styles.micro}>{c.recipient_id===me?'Möchte dich kennenlernen':'Von dir angefragt'}</Text></View></Row>
<View style={{marginTop:13,flexDirection:'row',flexWrap:'wrap',gap:8}}>{c.recipient_id===me?<><Button title="Annehmen" disabled={disabled} onPress={()=>respond(c.id,'accepted')}/><FamilyActionButton title="Ablehnen" destructive disabled={disabled} onPress={()=>respond(c.id,'declined')}/></>:<FamilyActionButton title="Anfrage zurückziehen" destructive disabled={disabled} onPress={()=>respond(c.id,'cancelled')}/>}</View>
</Card>)}
<Text style={styles.sectionTitle}>Bestätigte Kontakte</Text>
{accepted.length===0?<Blank title="Noch keine Kontakte" body="Bestätigte Familien erscheinen hier."/>:accepted.map(c=>{const uid=other(c);return <Card key={c.id} style={{marginBottom:10,borderColor:c.id===focusId?C.accent:C.line,borderWidth:c.id===focusId?2:1}}>
<Row><Avatar name={nameOf(uid)}/><View style={{flex:1}}><Text style={styles.cardTitle}>{nameOf(uid)}</Text><Text style={styles.micro}>{blocked(uid)?'Blockiert':'Kontakt bestätigt'}</Text></View></Row>
<View style={{marginTop:12,flexDirection:'row',flexWrap:'wrap',gap:8}}><Button title="Nachrichten" disabled={disabled||blocked(uid)} onPress={()=>onChat(c.id)}/>{blocked(uid)?<FamilyActionButton title="Entsperren" disabled={disabled} onPress={()=>onUnblock(uid)}/>:<FamilyActionButton title="Blockieren" destructive disabled={disabled} onPress={()=>onBlock(uid)}/>}</View>
</Card>;})}
</ScrollView>;
}
