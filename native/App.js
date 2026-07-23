import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

const colors = {
  bg: '#070A0B', surface: '#101516', raised: '#151B1C', line: '#26302C',
  text: '#F2F6F1', muted: '#8D9992', lime: '#C9FF62', blue: '#61A8FF',
  violet: '#A98BFF', orange: '#FF9C73', amber: '#F3C96B', red: '#FF717A', mint: '#61D5A8',
};

const tabs = [
  ['Pulse', 'pulse-outline'], ['Alerts', 'notifications-outline'], ['Sessions', 'layers-outline'],
  ['Growth', 'trending-up-outline'], ['Settings', 'options-outline'],
];

const runtimes = [
  { name: 'Codex', value: '3.8M', detail: '4 active · 84% quota', color: colors.blue },
  { name: 'OpenClaw', value: '614K', detail: 'Ready · quota unavailable', color: colors.orange },
  { name: 'Hermes', value: '8.4M', detail: '7 active · heavy burn', color: colors.violet },
];

function Header({ title, eyebrow = 'TOKEN PULSE', status = 'PREVIEW', statusColor = colors.amber }) {
  return <View style={styles.header}>
    <View style={styles.brandMark}><Ionicons name="pulse" size={18} color={colors.bg} /></View>
    <View style={{ flex: 1 }}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View>
    <View style={styles.live}><View style={[styles.liveDot, { backgroundColor: statusColor }]} /><Text style={[styles.liveText, { color: statusColor }]}>{status}</Text></View>
  </View>;
}

function Card({ children, accent, style }) {
  return <View style={[styles.card, accent && { borderLeftColor: accent, borderLeftWidth: 2 }, style]}>{children}</View>;
}

function Metric({ label, value, note, accent = colors.text }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color: accent }]}>{value}</Text>{note && <Text style={styles.metricNote}>{note}</Text>}</View>;
}

function Progress({ value, color = colors.lime }) {
  return <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, value))}%`, backgroundColor: color }]} /></View>;
}

function PulseScreen() {
  return <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <Header title="Agent command center" />
    <View style={styles.hero}><Text style={styles.metricLabel}>TOKENS TODAY</Text><Text style={styles.heroValue}>12.8M</Text><Text style={styles.heroNote}>38 sessions across 3 runtimes · synced just now</Text></View>
    <Card accent={colors.orange} style={styles.actionCard}>
      <View style={{ flex: 1 }}><Text style={styles.actionKicker}>NEXT BEST ACTION</Text><Text style={styles.actionTitle}>Hermes context is growing fast</Text><Text style={styles.actionText}>Summarize the completed phase before starting another heavy task.</Text></View>
      <Ionicons name="arrow-forward-circle" size={27} color={colors.orange} />
    </Card>
    <View style={styles.metricGrid}><Metric label="CACHE HIT" value="88%" accent={colors.violet} /><Metric label="QUOTA LEFT" value="84%" accent={colors.lime} /></View>
    <Text style={styles.sectionTitle}>RUNTIMES</Text>
    {runtimes.map(runtime => <Card key={runtime.name}>
      <View style={styles.runtimeRow}><View style={[styles.runtimeDot, { backgroundColor: runtime.color }]} /><View style={{ flex: 1 }}><Text style={styles.runtimeName}>{runtime.name}</Text><Text style={styles.runtimeDetail}>{runtime.detail}</Text></View><Text style={styles.runtimeValue}>{runtime.value}</Text></View>
      <Progress value={runtime.name === 'Hermes' ? 66 : runtime.name === 'Codex' ? 30 : 5} color={runtime.color} />
    </Card>)}
    <Text style={styles.truth}>Read-only preview · no prompts, files, or credentials leave this device</Text>
  </ScrollView>;
}

function AlertsScreen() {
  const alerts = [
    ['Runaway session risk', 'Hermes added 842K tokens in 15 minutes.', 'Review active session', colors.red, 'alert-circle'],
    ['Quota runway', 'Codex allowance is projected to last 3h 40m.', 'Route next heavy task', colors.amber, 'time'],
    ['Desktop sync healthy', 'Latest trusted sample arrived just now.', 'No action needed', colors.mint, 'checkmark-circle'],
  ];
  return <ScrollView contentContainerStyle={styles.scroll}><Header title="Intervention center" eyebrow="EVIDENCE-BASED ALERTS" /><Text style={styles.pageLead}>Know what needs attention before cost, context, or quota becomes a problem.</Text>{alerts.map(([title, detail, action, color, icon]) => <Card key={title} accent={color}><View style={styles.alertRow}><Ionicons name={icon} size={22} color={color} /><View style={{ flex: 1 }}><Text style={styles.alertTitle}>{title}</Text><Text style={styles.alertDetail}>{detail}</Text><Text style={[styles.alertAction, { color }]}>{action}</Text></View></View></Card>)}</ScrollView>;
}

function SessionsScreen() {
  const sessions = [
    ['Hermes', 'Token Pulse mobile architecture', '2.7M', 'now', colors.violet],
    ['Codex', 'Alert lifecycle regression sweep', '818K', '4m', colors.blue],
    ['Hermes', 'X growth workbook mapping', '604K', '11m', colors.violet],
    ['OpenClaw', 'Provider health scan', '141K', '18m', colors.orange],
  ];
  return <ScrollView contentContainerStyle={styles.scroll}><Header title="Live sessions" /><View style={styles.summaryStrip}><Metric label="ACTIVE NOW" value="14" accent={colors.lime} /><Metric label="BURN / HOUR" value="3.2M" accent={colors.orange} /></View><Text style={styles.sectionTitle}>TOP TOKEN BURNERS</Text>{sessions.map(([runtime, task, tokens, time, color], i) => <View style={styles.sessionRow} key={task}><Text style={styles.rank}>{i + 1}</Text><View style={[styles.runtimeDot, { backgroundColor: color }]} /><View style={{ flex: 1 }}><Text style={styles.sessionTitle}>{task}</Text><Text style={styles.sessionMeta}>{runtime} · {time}</Text></View><Text style={styles.sessionTokens}>{tokens}</Text></View>)}</ScrollView>;
}

function GrowthScreen() {
  return <ScrollView contentContainerStyle={styles.scroll}><Header title="PulseMark growth" eyebrow="X GROWTH COPILOT" status="SHEET · JUL 23" statusColor={colors.mint} /><View style={styles.sourceGrid}><Card style={styles.sourceCard}><Text style={styles.metricLabel}>GOOGLE SHEET</Text><Text style={[styles.sourceState, { color: colors.mint }]}>SNAPSHOT CONNECTED</Text><Text style={styles.metricNote}>14-tab growth dashboard</Text></Card><Card style={styles.sourceCard}><Text style={styles.metricLabel}>X ANALYTICS</Text><Text style={[styles.sourceState, { color: colors.amber }]}>OAUTH REQUIRED</Text><Text style={styles.metricNote}>Private metrics not live</Text></Card></View><Card accent={colors.blue}><Text style={styles.metricLabel}>NORTH STAR</Text><View style={styles.goalRow}><Text style={styles.goalValue}>185</Text><Text style={styles.goalTotal}> / 10,000 followers</Text></View><Progress value={1.85} color={colors.blue} /><Text style={styles.metricNote}>9,815 remaining · verified workbook baseline</Text></Card><View style={styles.metricGrid}><Metric label="ALGORITHM GATE" value="67" note="HOLD" accent={colors.amber} /><Metric label="VERIFIED VIEWS" value="6,434" note="72 posts" accent={colors.blue} /></View><Text style={styles.sectionTitle}>TODAY'S GROWTH MOVE</Text><Card style={styles.growthMove}><Text style={styles.actionKicker}>WORKBOOK DECISION</Text><Text style={styles.actionTitle}>Publish less. Prove more.</Text><Text style={styles.actionText}>Cap originals at four per day, space them by at least three hours, and publish one proof-led flagship post.</Text><View style={styles.pillRow}><Text style={styles.pill}>≤4 posts</Text><Text style={styles.pill}>≥3h apart</Text><Text style={styles.pill}>measure 24h</Text></View></Card><Text style={styles.sectionTitle}>VERIFIED BASELINE</Text>{[['Median views / post', 61, colors.blue], ['Interaction rate', 58, colors.orange], ['Zero-action posts', 67, colors.red]].map(([label, value, color]) => <Card key={label}><View style={styles.signalHead}><Text style={styles.runtimeName}>{label}</Text><Text style={[styles.runtimeValue, { color }]}>{label === 'Interaction rate' ? '0.58%' : label === 'Median views / post' ? '61' : '66.7%'}</Text></View><Progress value={value} color={color} /></Card>)}</ScrollView>;
}

function SettingsScreen() {
  return <ScrollView contentContainerStyle={styles.scroll}><Header title="Control & privacy" /><Text style={styles.sectionTitle}>CONNECTIONS</Text><Card><Text style={styles.settingTitle}>Desktop relay</Text><Text style={styles.settingDetail}>Not connected in this preview build</Text><Text style={styles.settingAction}>Connect with encrypted device session</Text></Card><Card><Text style={styles.settingTitle}>Google Growth Dashboard</Text><Text style={styles.settingDetail}>Authorized in Codex · runtime OAuth still required</Text><Text style={[styles.settingAction, { color: colors.mint }]}>Workbook snapshot verified July 23</Text></Card><Card><Text style={styles.settingTitle}>X account analytics</Text><Text style={styles.settingDetail}>Private impressions, profile visits, and follows need X OAuth user context</Text><Text style={[styles.settingAction, { color: colors.amber }]}>Not connected · no live claim</Text></Card><Text style={styles.sectionTitle}>PRIVACY MODE</Text>{[['Totals only', true], ['Redact session titles', false], ['Show model names', false]].map(([label, active]) => <View key={label} style={styles.settingRow}><Text style={styles.settingTitle}>{label}</Text><Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={21} color={active ? colors.lime : colors.muted} /></View>)}<Text style={styles.sectionTitle}>DEVICE</Text><Card><Text style={styles.settingTitle}>This iPhone</Text><Text style={styles.settingDetail}>Read-only · remote actions disabled</Text></Card><Text style={styles.truth}>Credentials will use SecureStore in the connected development build.</Text></ScrollView>;
}

const screens = { Pulse: PulseScreen, Alerts: AlertsScreen, Sessions: SessionsScreen, Growth: GrowthScreen, Settings: SettingsScreen };

export default function App() {
  const [active, setActive] = useState('Pulse');
  const Screen = screens[active];
  return <SafeAreaView style={styles.app}><StatusBar style="light" /><View style={styles.screen}><Screen /></View><View style={styles.tabBar}>{tabs.map(([label, icon]) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: active === label }} key={label} onPress={() => setActive(label)} style={styles.tab}><Ionicons name={icon} size={21} color={active === label ? colors.lime : colors.muted} /><Text style={[styles.tabLabel, active === label && styles.tabActive]}>{label}</Text>{label === 'Alerts' && <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>}</Pressable>)}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg }, screen: { flex: 1 }, scroll: { padding: 18, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingTop: 8, paddingBottom: 20 }, brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#93A47F', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, title: { color: colors.text, fontSize: 21, fontWeight: '700', letterSpacing: -0.4, marginTop: 2 }, live: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: colors.line }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber }, liveText: { color: colors.amber, fontSize: 8, fontWeight: '800' },
  hero: { paddingVertical: 15 }, heroValue: { color: colors.text, fontSize: 54, lineHeight: 58, fontWeight: '700', letterSpacing: -2.5 }, heroNote: { color: colors.muted, fontSize: 11, marginTop: 4 }, card: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 15, padding: 14, marginBottom: 9 }, actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#171513' }, actionKicker: { color: colors.orange, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 }, actionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 5 }, actionText: { color: '#AAB4AE', fontSize: 11, lineHeight: 16, marginTop: 5 }, metricGrid: { flexDirection: 'row', gap: 9, marginBottom: 4 }, metric: { flex: 1, minWidth: 0, paddingVertical: 8 }, metricLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, metricValue: { color: colors.text, fontSize: 25, fontWeight: '700', marginTop: 6, letterSpacing: -0.8 }, metricNote: { color: colors.muted, fontSize: 9, marginTop: 4 }, sectionTitle: { color: '#93A47F', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 17, marginBottom: 9 }, runtimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, runtimeDot: { width: 8, height: 8, borderRadius: 4 }, runtimeName: { color: colors.text, fontSize: 13, fontWeight: '700' }, runtimeDetail: { color: colors.muted, fontSize: 9, marginTop: 3 }, runtimeValue: { color: colors.text, fontSize: 15, fontWeight: '700' }, progress: { height: 3, backgroundColor: '#27302D', marginTop: 11, overflow: 'hidden' }, progressFill: { height: '100%' }, truth: { color: '#68736D', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 18 },
  pageLead: { color: '#AAB4AE', fontSize: 13, lineHeight: 19, marginBottom: 18 }, alertRow: { flexDirection: 'row', gap: 11 }, alertTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, alertDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }, alertAction: { fontSize: 10, fontWeight: '700', marginTop: 7 }, summaryStrip: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, gap: 18, marginBottom: 5 }, sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line }, rank: { color: '#647069', width: 16, fontSize: 10, fontWeight: '700' }, sessionTitle: { color: colors.text, fontSize: 12, fontWeight: '650' }, sessionMeta: { color: colors.muted, fontSize: 9, marginTop: 3 }, sessionTokens: { color: colors.lime, fontSize: 12, fontWeight: '700' },
  sourceGrid: { flexDirection: 'row', gap: 8 }, sourceCard: { flex: 1, minWidth: 0 }, sourceState: { fontSize: 10, fontWeight: '800', marginTop: 7 }, goalRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }, goalValue: { color: colors.text, fontSize: 38, fontWeight: '700', letterSpacing: -1.4 }, goalTotal: { color: colors.muted, fontSize: 13 }, growthMove: { backgroundColor: '#10171A', borderColor: '#264658' }, pillRow: { flexDirection: 'row', gap: 7, marginTop: 13 }, pill: { color: '#B9D8EA', backgroundColor: '#162630', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '700' }, signalHead: { flexDirection: 'row', justifyContent: 'space-between' }, settingTitle: { color: colors.text, fontSize: 13, fontWeight: '700' }, settingDetail: { color: colors.muted, fontSize: 10, marginTop: 5 }, settingAction: { color: colors.lime, fontSize: 10, fontWeight: '700', marginTop: 10 }, settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, borderBottomWidth: 1, borderColor: colors.line },
  tabBar: { flexDirection: 'row', minHeight: 68, paddingTop: 8, paddingBottom: 7, borderTopWidth: 1, borderColor: colors.line, backgroundColor: '#090D0E' }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, position: 'relative' }, tabLabel: { color: colors.muted, fontSize: 9, fontWeight: '600' }, tabActive: { color: colors.lime }, badge: { position: 'absolute', top: -3, right: 18, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
