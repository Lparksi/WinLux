import enCommon from '../locales/en-US/common.json'
import arSaCommon from '../locales/ar-SA/common.json'
import bgBgCommon from '../locales/bg-BG/common.json'
import csCzCommon from '../locales/cs-CZ/common.json'
import daDkCommon from '../locales/da-DK/common.json'
import deDeCommon from '../locales/de-DE/common.json'
import elGrCommon from '../locales/el-GR/common.json'
import es419Common from '../locales/es-419/common.json'
import esEsCommon from '../locales/es-ES/common.json'
import fiFiCommon from '../locales/fi-FI/common.json'
import frFrCommon from '../locales/fr-FR/common.json'
import huHuCommon from '../locales/hu-HU/common.json'
import idIdCommon from '../locales/id-ID/common.json'
import itItCommon from '../locales/it-IT/common.json'
import jaJpCommon from '../locales/ja-JP/common.json'
import koKrCommon from '../locales/ko-KR/common.json'
import nbNoCommon from '../locales/nb-NO/common.json'
import nlNlCommon from '../locales/nl-NL/common.json'
import plPlCommon from '../locales/pl-PL/common.json'
import ptBrCommon from '../locales/pt-BR/common.json'
import ptPtCommon from '../locales/pt-PT/common.json'
import roRoCommon from '../locales/ro-RO/common.json'
import ruRuCommon from '../locales/ru-RU/common.json'
import svSeCommon from '../locales/sv-SE/common.json'
import thThCommon from '../locales/th-TH/common.json'
import trTrCommon from '../locales/tr-TR/common.json'
import ukUaCommon from '../locales/uk-UA/common.json'
import viVnCommon from '../locales/vi-VN/common.json'
import zhCnCommon from '../locales/zh-CN/common.json'
import zhTwCommon from '../locales/zh-TW/common.json'

export const INSTALLER_LANGUAGES = [
  'English',
  'SimpChinese',
  'TradChinese',
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indonesian',
  'French',
  'German',
  'Italian',
  'Spanish',
  'SpanishInternational',
  'Portuguese',
  'PortugueseBR',
  'Russian',
  'Polish',
  'Turkish',
  'Ukrainian',
  'Czech',
  'Hungarian',
  'Greek',
  'Bulgarian',
  'Romanian',
  'Arabic',
  'Dutch',
  'Danish',
  'Finnish',
  'Norwegian',
  'Swedish',
] as const

export type InstallerLanguage = (typeof INSTALLER_LANGUAGES)[number]

type SharedLocale =
  | 'ar-SA'
  | 'bg-BG'
  | 'cs-CZ'
  | 'da-DK'
  | 'de-DE'
  | 'el-GR'
  | 'en-US'
  | 'es-419'
  | 'fi-FI'
  | 'hu-HU'
  | 'id-ID'
  | 'it-IT'
  | 'nb-NO'
  | 'nl-NL'
  | 'pl-PL'
  | 'pt-BR'
  | 'pt-PT'
  | 'ro-RO'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja-JP'
  | 'ko-KR'
  | 'fr-FR'
  | 'es-ES'
  | 'sv-SE'
  | 'th-TH'
  | 'tr-TR'
  | 'uk-UA'
  | 'vi-VN'
  | 'ru-RU'
type InterpolationValues = Record<string, string | number>

const SHARED_MESSAGES: Record<SharedLocale, Record<string, string>> = {
  'ar-SA': arSaCommon,
  'bg-BG': bgBgCommon,
  'cs-CZ': csCzCommon,
  'da-DK': daDkCommon,
  'de-DE': deDeCommon,
  'el-GR': elGrCommon,
  'en-US': enCommon,
  'es-419': es419Common,
  'es-ES': esEsCommon,
  'fi-FI': fiFiCommon,
  'fr-FR': frFrCommon,
  'hu-HU': huHuCommon,
  'id-ID': idIdCommon,
  'it-IT': itItCommon,
  'ja-JP': jaJpCommon,
  'ko-KR': koKrCommon,
  'nb-NO': nbNoCommon,
  'nl-NL': nlNlCommon,
  'pl-PL': plPlCommon,
  'pt-BR': ptBrCommon,
  'pt-PT': ptPtCommon,
  'ro-RO': roRoCommon,
  'ru-RU': ruRuCommon,
  'sv-SE': svSeCommon,
  'th-TH': thThCommon,
  'tr-TR': trTrCommon,
  'uk-UA': ukUaCommon,
  'vi-VN': viVnCommon,
  'zh-CN': zhCnCommon,
  'zh-TW': zhTwCommon,
}

const SHARED_LOCALE_BY_LANGUAGE: Record<InstallerLanguage, SharedLocale> = {
  English: 'en-US',
  SimpChinese: 'zh-CN',
  TradChinese: 'zh-TW',
  Japanese: 'ja-JP',
  Korean: 'ko-KR',
  Thai: 'th-TH',
  Vietnamese: 'vi-VN',
  Indonesian: 'id-ID',
  French: 'fr-FR',
  German: 'de-DE',
  Italian: 'it-IT',
  Spanish: 'es-ES',
  SpanishInternational: 'es-419',
  Portuguese: 'pt-PT',
  PortugueseBR: 'pt-BR',
  Russian: 'ru-RU',
  Polish: 'pl-PL',
  Turkish: 'tr-TR',
  Ukrainian: 'uk-UA',
  Czech: 'cs-CZ',
  Hungarian: 'hu-HU',
  Greek: 'el-GR',
  Bulgarian: 'bg-BG',
  Romanian: 'ro-RO',
  Arabic: 'ar-SA',
  Dutch: 'nl-NL',
  Danish: 'da-DK',
  Finnish: 'fi-FI',
  Norwegian: 'nb-NO',
  Swedish: 'sv-SE',
}

const INTERPOLATION_PATTERN = /\{([a-zA-Z0-9_]+)\}/g

const resolveLanguageKey = (language: string): InstallerLanguage => {
  const key = language as InstallerLanguage
  if (INSTALLER_LANGUAGES.includes(key)) {
    return key
  }

  const normalized = language.toLowerCase()
  return INSTALLER_LANGUAGES.find((candidate) => candidate.toLowerCase() === normalized) ?? 'English'
}

const resolveSharedLocale = (language: string): SharedLocale => {
  const key = resolveLanguageKey(language)
  return SHARED_LOCALE_BY_LANGUAGE[key]
}

export const translate = (
  language: string,
  translationKey: string,
  values?: InterpolationValues,
): string => {
  const locale = resolveSharedLocale(language)
  const message =
    SHARED_MESSAGES[locale][translationKey] ??
    SHARED_MESSAGES['en-US'][translationKey] ??
    translationKey

  if (!values) {
    return message
  }

  return message.replace(INTERPOLATION_PATTERN, (_, token: string) => {
    if (!(token in values)) {
      return `{${token}}`
    }

    return String(values[token])
  })
}

export type Messages = {
  subtitle: string
  loading: string
  dark: string
  light: string
  mixed: string
  bothDark: string
  bothLight: string
  mixedDetail: (apps: string, system: string) => string
  refreshStatus: string
  hideToTrayHint: string
  moreInfo: string
  registryPath: string
  language: string
  languageAuto: string
  effectiveLanguage: string
}

type MessageDefinition = Omit<Messages, 'mixedDetail'> & {
  mixedAppsLabel: string
  mixedSystemLabel: string
  mixedSeparator: string
}

const createMessages = ({
  mixedAppsLabel,
  mixedSystemLabel,
  mixedSeparator,
  ...definition
}: MessageDefinition): Messages => ({
  ...definition,
  mixedDetail: (apps, system) =>
    `${mixedAppsLabel}: ${apps}${mixedSeparator}${mixedSystemLabel}: ${system}`,
})

const EN_MESSAGES = createMessages({
  subtitle: 'One-click switch for Windows dark/light mode',
  loading: 'Loading…',
  dark: 'Dark',
  light: 'Light',
  mixed: 'Mixed',
  bothDark: 'Apps and system are both in dark mode',
  bothLight: 'Apps and system are both in light mode',
  refreshStatus: 'Refresh status',
  hideToTrayHint: 'Tip: closing the window will hide to tray instead of exiting.',
  moreInfo: 'More Info',
  registryPath: 'Registry Path',
  language: 'Language',
  languageAuto: 'Auto (Follow system)',
  effectiveLanguage: 'Effective language',
  mixedAppsLabel: 'Apps',
  mixedSystemLabel: 'System',
  mixedSeparator: ' | ',
})

const ZH_CN_MESSAGES = createMessages({
  subtitle: '一键切换 Windows 深色/浅色',
  loading: '读取中…',
  dark: '深色',
  light: '浅色',
  mixed: '混合',
  bothDark: '应用与系统均为深色模式',
  bothLight: '应用与系统均为浅色模式',
  refreshStatus: '刷新状态',
  hideToTrayHint: '提示：关闭窗口不会退出，会隐藏到托盘。',
  moreInfo: '更多信息',
  registryPath: '注册表路径',
  language: '语言',
  languageAuto: '自动（跟随系统）',
  effectiveLanguage: '当前生效语言',
  mixedAppsLabel: '应用',
  mixedSystemLabel: '系统',
  mixedSeparator: '｜',
})

const ZH_TW_MESSAGES = createMessages({
  subtitle: '一鍵切換 Windows 深色/淺色',
  loading: '讀取中…',
  dark: '深色',
  light: '淺色',
  mixed: '混合',
  bothDark: '應用程式與系統皆為深色模式',
  bothLight: '應用程式與系統皆為淺色模式',
  refreshStatus: '重新整理狀態',
  hideToTrayHint: '提示：關閉視窗不會退出，會隱藏到系統匣。',
  moreInfo: '更多資訊',
  registryPath: '登錄路徑',
  language: '語言',
  languageAuto: '自動（跟隨系統）',
  effectiveLanguage: '目前生效語言',
  mixedAppsLabel: '應用程式',
  mixedSystemLabel: '系統',
  mixedSeparator: '｜',
})

const JA_MESSAGES = createMessages({
  subtitle: 'Windows のダーク/ライトモードをワンクリックで切り替え',
  loading: '読み込み中…',
  dark: 'ダーク',
  light: 'ライト',
  mixed: '混合',
  bothDark: 'アプリとシステムはどちらもダークモードです',
  bothLight: 'アプリとシステムはどちらもライトモードです',
  refreshStatus: '状態を更新',
  hideToTrayHint: 'ヒント: ウィンドウを閉じても終了せず、トレイに隠れます。',
  moreInfo: '詳細',
  registryPath: 'レジストリ パス',
  language: '言語',
  languageAuto: '自動（システムに従う）',
  effectiveLanguage: '現在の言語',
  mixedAppsLabel: 'アプリ',
  mixedSystemLabel: 'システム',
  mixedSeparator: ' | ',
})

const KO_MESSAGES = createMessages({
  subtitle: 'Windows 다크/라이트 모드를 원클릭 전환',
  loading: '불러오는 중…',
  dark: '다크',
  light: '라이트',
  mixed: '혼합',
  bothDark: '앱과 시스템이 모두 다크 모드입니다',
  bothLight: '앱과 시스템이 모두 라이트 모드입니다',
  refreshStatus: '상태 새로고침',
  hideToTrayHint: '팁: 창을 닫아도 종료되지 않고 트레이로 숨겨집니다.',
  moreInfo: '추가 정보',
  registryPath: '레지스트리 경로',
  language: '언어',
  languageAuto: '자동 (시스템 따라가기)',
  effectiveLanguage: '현재 적용 언어',
  mixedAppsLabel: '앱',
  mixedSystemLabel: '시스템',
  mixedSeparator: ' | ',
})

const TH_MESSAGES = createMessages({
  subtitle: 'สลับโหมดมืด/สว่างของ Windows ได้ในคลิกเดียว',
  loading: 'กำลังโหลด…',
  dark: 'มืด',
  light: 'สว่าง',
  mixed: 'ผสม',
  bothDark: 'แอปและระบบเป็นโหมดมืดทั้งคู่',
  bothLight: 'แอปและระบบเป็นโหมดสว่างทั้งคู่',
  refreshStatus: 'รีเฟรชสถานะ',
  hideToTrayHint: 'เคล็ดลับ: ปิดหน้าต่างแล้วแอปจะซ่อนไปที่ถาด ไม่ได้ออกจากโปรแกรม',
  moreInfo: 'ข้อมูลเพิ่มเติม',
  registryPath: 'เส้นทางรีจิสทรี',
  language: 'ภาษา',
  languageAuto: 'อัตโนมัติ (ตามระบบ)',
  effectiveLanguage: 'ภาษาที่ใช้งาน',
  mixedAppsLabel: 'แอป',
  mixedSystemLabel: 'ระบบ',
  mixedSeparator: ' | ',
})

const VI_MESSAGES = createMessages({
  subtitle: 'Chuyển nhanh chế độ tối/sáng Windows chỉ với một cú nhấp',
  loading: 'Đang tải…',
  dark: 'Tối',
  light: 'Sáng',
  mixed: 'Hỗn hợp',
  bothDark: 'Ứng dụng và hệ thống đều ở chế độ tối',
  bothLight: 'Ứng dụng và hệ thống đều ở chế độ sáng',
  refreshStatus: 'Làm mới trạng thái',
  hideToTrayHint: 'Mẹo: đóng cửa sổ sẽ ẩn vào khay thay vì thoát.',
  moreInfo: 'Thông tin thêm',
  registryPath: 'Đường dẫn Registry',
  language: 'Ngôn ngữ',
  languageAuto: 'Tự động (Theo hệ thống)',
  effectiveLanguage: 'Ngôn ngữ hiệu lực',
  mixedAppsLabel: 'Ứng dụng',
  mixedSystemLabel: 'Hệ thống',
  mixedSeparator: ' | ',
})

const ID_MESSAGES = createMessages({
  subtitle: 'Satu klik untuk beralih mode gelap/terang Windows',
  loading: 'Memuat…',
  dark: 'Gelap',
  light: 'Terang',
  mixed: 'Campuran',
  bothDark: 'Aplikasi dan sistem sama-sama dalam mode gelap',
  bothLight: 'Aplikasi dan sistem sama-sama dalam mode terang',
  refreshStatus: 'Segarkan status',
  hideToTrayHint: 'Tips: menutup jendela akan menyembunyikan aplikasi ke tray, bukan keluar.',
  moreInfo: 'Info Lainnya',
  registryPath: 'Path Registry',
  language: 'Bahasa',
  languageAuto: 'Otomatis (Ikuti sistem)',
  effectiveLanguage: 'Bahasa aktif',
  mixedAppsLabel: 'Aplikasi',
  mixedSystemLabel: 'Sistem',
  mixedSeparator: ' | ',
})

const FR_MESSAGES = createMessages({
  subtitle: 'Basculez le mode sombre/clair de Windows en un clic',
  loading: 'Chargement…',
  dark: 'Sombre',
  light: 'Clair',
  mixed: 'Mixte',
  bothDark: 'Les applications et le système sont en mode sombre',
  bothLight: 'Les applications et le système sont en mode clair',
  refreshStatus: 'Actualiser l’état',
  hideToTrayHint: 'Astuce : fermer la fenêtre la masque dans la zone de notification.',
  moreInfo: 'Plus d’infos',
  registryPath: 'Chemin du Registre',
  language: 'Langue',
  languageAuto: 'Auto (Suivre le système)',
  effectiveLanguage: 'Langue active',
  mixedAppsLabel: 'Applications',
  mixedSystemLabel: 'Système',
  mixedSeparator: ' | ',
})

const DE_MESSAGES = createMessages({
  subtitle: 'Windows-Dunkel-/Hellmodus mit einem Klick umschalten',
  loading: 'Wird geladen…',
  dark: 'Dunkel',
  light: 'Hell',
  mixed: 'Gemischt',
  bothDark: 'Apps und System sind beide im Dunkelmodus',
  bothLight: 'Apps und System sind beide im Hellmodus',
  refreshStatus: 'Status aktualisieren',
  hideToTrayHint: 'Tipp: Beim Schließen wird das Fenster in den Tray minimiert statt beendet.',
  moreInfo: 'Mehr Infos',
  registryPath: 'Registrierungspfad',
  language: 'Sprache',
  languageAuto: 'Auto (System folgen)',
  effectiveLanguage: 'Aktive Sprache',
  mixedAppsLabel: 'Apps',
  mixedSystemLabel: 'System',
  mixedSeparator: ' | ',
})

const IT_MESSAGES = createMessages({
  subtitle: 'Passa tra tema scuro/chiaro di Windows con un clic',
  loading: 'Caricamento…',
  dark: 'Scuro',
  light: 'Chiaro',
  mixed: 'Misto',
  bothDark: 'App e sistema sono entrambi in modalità scura',
  bothLight: 'App e sistema sono entrambi in modalità chiara',
  refreshStatus: 'Aggiorna stato',
  hideToTrayHint: 'Suggerimento: chiudendo la finestra l’app va nel tray invece di uscire.',
  moreInfo: 'Maggiori info',
  registryPath: 'Percorso Registro',
  language: 'Lingua',
  languageAuto: 'Auto (Segui sistema)',
  effectiveLanguage: 'Lingua attiva',
  mixedAppsLabel: 'App',
  mixedSystemLabel: 'Sistema',
  mixedSeparator: ' | ',
})

const ES_MESSAGES = createMessages({
  subtitle: 'Cambia el modo oscuro/claro de Windows con un clic',
  loading: 'Cargando…',
  dark: 'Oscuro',
  light: 'Claro',
  mixed: 'Mixto',
  bothDark: 'Aplicaciones y sistema están en modo oscuro',
  bothLight: 'Aplicaciones y sistema están en modo claro',
  refreshStatus: 'Actualizar estado',
  hideToTrayHint: 'Consejo: al cerrar la ventana se oculta en la bandeja en lugar de salir.',
  moreInfo: 'Más información',
  registryPath: 'Ruta del Registro',
  language: 'Idioma',
  languageAuto: 'Auto (Seguir sistema)',
  effectiveLanguage: 'Idioma efectivo',
  mixedAppsLabel: 'Aplicaciones',
  mixedSystemLabel: 'Sistema',
  mixedSeparator: ' | ',
})

const ES_INTL_MESSAGES = createMessages({
  subtitle: 'Cambia el modo oscuro/claro de Windows con un clic',
  loading: 'Cargando…',
  dark: 'Oscuro',
  light: 'Claro',
  mixed: 'Mixto',
  bothDark: 'Aplicaciones y sistema están en modo oscuro',
  bothLight: 'Aplicaciones y sistema están en modo claro',
  refreshStatus: 'Actualizar estado',
  hideToTrayHint: 'Consejo: al cerrar la ventana se oculta en la bandeja y no se cierra.',
  moreInfo: 'Más información',
  registryPath: 'Ruta del Registro',
  language: 'Idioma',
  languageAuto: 'Auto (Seguir sistema)',
  effectiveLanguage: 'Idioma activo',
  mixedAppsLabel: 'Aplicaciones',
  mixedSystemLabel: 'Sistema',
  mixedSeparator: ' | ',
})

const PT_MESSAGES = createMessages({
  subtitle: 'Mude o modo escuro/claro do Windows com um clique',
  loading: 'A carregar…',
  dark: 'Escuro',
  light: 'Claro',
  mixed: 'Misto',
  bothDark: 'Aplicações e sistema estão em modo escuro',
  bothLight: 'Aplicações e sistema estão em modo claro',
  refreshStatus: 'Atualizar estado',
  hideToTrayHint: 'Dica: ao fechar a janela, a app é ocultada na bandeja em vez de sair.',
  moreInfo: 'Mais informações',
  registryPath: 'Caminho do Registo',
  language: 'Idioma',
  languageAuto: 'Auto (Seguir sistema)',
  effectiveLanguage: 'Idioma ativo',
  mixedAppsLabel: 'Aplicações',
  mixedSystemLabel: 'Sistema',
  mixedSeparator: ' | ',
})

const PT_BR_MESSAGES = createMessages({
  subtitle: 'Alterne o modo escuro/claro do Windows com um clique',
  loading: 'Carregando…',
  dark: 'Escuro',
  light: 'Claro',
  mixed: 'Misto',
  bothDark: 'Aplicativos e sistema estão em modo escuro',
  bothLight: 'Aplicativos e sistema estão em modo claro',
  refreshStatus: 'Atualizar status',
  hideToTrayHint: 'Dica: ao fechar a janela, o app é ocultado na bandeja em vez de sair.',
  moreInfo: 'Mais informações',
  registryPath: 'Caminho do Registro',
  language: 'Idioma',
  languageAuto: 'Automático (Seguir sistema)',
  effectiveLanguage: 'Idioma ativo',
  mixedAppsLabel: 'Aplicativos',
  mixedSystemLabel: 'Sistema',
  mixedSeparator: ' | ',
})

const RU_MESSAGES = createMessages({
  subtitle: 'Переключение тёмной/светлой темы Windows в один клик',
  loading: 'Загрузка…',
  dark: 'Тёмная',
  light: 'Светлая',
  mixed: 'Смешанная',
  bothDark: 'Приложения и система в тёмном режиме',
  bothLight: 'Приложения и система в светлом режиме',
  refreshStatus: 'Обновить состояние',
  hideToTrayHint: 'Совет: при закрытии окно скрывается в трей, а не завершает работу.',
  moreInfo: 'Подробнее',
  registryPath: 'Путь реестра',
  language: 'Язык',
  languageAuto: 'Авто (По системе)',
  effectiveLanguage: 'Текущий язык',
  mixedAppsLabel: 'Приложения',
  mixedSystemLabel: 'Система',
  mixedSeparator: ' | ',
})

const PL_MESSAGES = createMessages({
  subtitle: 'Przełączaj tryb ciemny/jasny systemu Windows jednym kliknięciem',
  loading: 'Ładowanie…',
  dark: 'Ciemny',
  light: 'Jasny',
  mixed: 'Mieszany',
  bothDark: 'Aplikacje i system są w trybie ciemnym',
  bothLight: 'Aplikacje i system są w trybie jasnym',
  refreshStatus: 'Odśwież stan',
  hideToTrayHint: 'Wskazówka: zamknięcie okna ukrywa aplikację do zasobnika zamiast ją kończyć.',
  moreInfo: 'Więcej informacji',
  registryPath: 'Ścieżka rejestru',
  language: 'Język',
  languageAuto: 'Auto (Według systemu)',
  effectiveLanguage: 'Aktywny język',
  mixedAppsLabel: 'Aplikacje',
  mixedSystemLabel: 'System',
  mixedSeparator: ' | ',
})

const TR_MESSAGES = createMessages({
  subtitle: 'Windows koyu/açık modunu tek tıkla değiştirin',
  loading: 'Yükleniyor…',
  dark: 'Koyu',
  light: 'Açık',
  mixed: 'Karma',
  bothDark: 'Uygulamalar ve sistem koyu modda',
  bothLight: 'Uygulamalar ve sistem açık modda',
  refreshStatus: 'Durumu yenile',
  hideToTrayHint: 'İpucu: pencereyi kapatınca uygulama çıkmaz, tepsiye gizlenir.',
  moreInfo: 'Daha fazla bilgi',
  registryPath: 'Kayıt Defteri Yolu',
  language: 'Dil',
  languageAuto: 'Otomatik (Sistemi takip et)',
  effectiveLanguage: 'Etkin dil',
  mixedAppsLabel: 'Uygulamalar',
  mixedSystemLabel: 'Sistem',
  mixedSeparator: ' | ',
})

const UK_MESSAGES = createMessages({
  subtitle: 'Перемикайте темний/світлий режим Windows одним кліком',
  loading: 'Завантаження…',
  dark: 'Темний',
  light: 'Світлий',
  mixed: 'Змішаний',
  bothDark: 'Програми й система в темному режимі',
  bothLight: 'Програми й система у світлому режимі',
  refreshStatus: 'Оновити стан',
  hideToTrayHint: 'Порада: закриття вікна ховає застосунок у трей, а не завершує його.',
  moreInfo: 'Докладніше',
  registryPath: 'Шлях реєстру',
  language: 'Мова',
  languageAuto: 'Авто (За системою)',
  effectiveLanguage: 'Активна мова',
  mixedAppsLabel: 'Програми',
  mixedSystemLabel: 'Система',
  mixedSeparator: ' | ',
})

const CS_MESSAGES = createMessages({
  subtitle: 'Přepínejte tmavý/světlý režim Windows jedním kliknutím',
  loading: 'Načítání…',
  dark: 'Tmavý',
  light: 'Světlý',
  mixed: 'Smíšený',
  bothDark: 'Aplikace i systém jsou v tmavém režimu',
  bothLight: 'Aplikace i systém jsou ve světlém režimu',
  refreshStatus: 'Obnovit stav',
  hideToTrayHint: 'Tip: zavření okna aplikaci ukryje do oznamovací oblasti místo ukončení.',
  moreInfo: 'Více informací',
  registryPath: 'Cesta v registru',
  language: 'Jazyk',
  languageAuto: 'Auto (Podle systému)',
  effectiveLanguage: 'Aktivní jazyk',
  mixedAppsLabel: 'Aplikace',
  mixedSystemLabel: 'Systém',
  mixedSeparator: ' | ',
})

const HU_MESSAGES = createMessages({
  subtitle: 'Válts Windows sötét/világos mód között egy kattintással',
  loading: 'Betöltés…',
  dark: 'Sötét',
  light: 'Világos',
  mixed: 'Vegyes',
  bothDark: 'Az alkalmazások és a rendszer is sötét módban vannak',
  bothLight: 'Az alkalmazások és a rendszer is világos módban vannak',
  refreshStatus: 'Állapot frissítése',
  hideToTrayHint: 'Tipp: az ablak bezárása nem kilépés, hanem tálcára rejtés.',
  moreInfo: 'További információ',
  registryPath: 'Rendszerleíró útvonal',
  language: 'Nyelv',
  languageAuto: 'Auto (Rendszer követése)',
  effectiveLanguage: 'Aktív nyelv',
  mixedAppsLabel: 'Alkalmazások',
  mixedSystemLabel: 'Rendszer',
  mixedSeparator: ' | ',
})

const EL_MESSAGES = createMessages({
  subtitle: 'Εναλλαγή σκοτεινής/φωτεινής λειτουργίας Windows με ένα κλικ',
  loading: 'Φόρτωση…',
  dark: 'Σκοτεινό',
  light: 'Φωτεινό',
  mixed: 'Μικτό',
  bothDark: 'Εφαρμογές και σύστημα είναι σε σκοτεινή λειτουργία',
  bothLight: 'Εφαρμογές και σύστημα είναι σε φωτεινή λειτουργία',
  refreshStatus: 'Ανανέωση κατάστασης',
  hideToTrayHint: 'Συμβουλή: το κλείσιμο παραθύρου κρύβει την εφαρμογή στο tray αντί να την τερματίζει.',
  moreInfo: 'Περισσότερα',
  registryPath: 'Διαδρομή Μητρώου',
  language: 'Γλώσσα',
  languageAuto: 'Αυτόματο (Ακολουθεί σύστημα)',
  effectiveLanguage: 'Ενεργή γλώσσα',
  mixedAppsLabel: 'Εφαρμογές',
  mixedSystemLabel: 'Σύστημα',
  mixedSeparator: ' | ',
})

const BG_MESSAGES = createMessages({
  subtitle: 'Превключвайте тъмен/светъл режим на Windows с едно щракване',
  loading: 'Зареждане…',
  dark: 'Тъмен',
  light: 'Светъл',
  mixed: 'Смесен',
  bothDark: 'Приложенията и системата са в тъмен режим',
  bothLight: 'Приложенията и системата са в светъл режим',
  refreshStatus: 'Обнови състоянието',
  hideToTrayHint: 'Съвет: затварянето на прозореца скрива приложението в трея, без изход.',
  moreInfo: 'Още информация',
  registryPath: 'Път в регистъра',
  language: 'Език',
  languageAuto: 'Автоматично (По системата)',
  effectiveLanguage: 'Активен език',
  mixedAppsLabel: 'Приложения',
  mixedSystemLabel: 'Система',
  mixedSeparator: ' | ',
})

const RO_MESSAGES = createMessages({
  subtitle: 'Comută tema întunecată/luminoasă din Windows cu un clic',
  loading: 'Se încarcă…',
  dark: 'Întunecat',
  light: 'Luminos',
  mixed: 'Mixt',
  bothDark: 'Aplicațiile și sistemul sunt în modul întunecat',
  bothLight: 'Aplicațiile și sistemul sunt în modul luminos',
  refreshStatus: 'Actualizează starea',
  hideToTrayHint: 'Sfat: închiderea ferestrei ascunde aplicația în tray, nu o închide.',
  moreInfo: 'Mai multe informații',
  registryPath: 'Cale registru',
  language: 'Limbă',
  languageAuto: 'Auto (Urmează sistemul)',
  effectiveLanguage: 'Limbă activă',
  mixedAppsLabel: 'Aplicații',
  mixedSystemLabel: 'Sistem',
  mixedSeparator: ' | ',
})

const AR_MESSAGES = createMessages({
  subtitle: 'التبديل بين الوضع الداكن/الفاتح في ويندوز بنقرة واحدة',
  loading: 'جارٍ التحميل…',
  dark: 'داكن',
  light: 'فاتح',
  mixed: 'مختلط',
  bothDark: 'التطبيقات والنظام في الوضع الداكن',
  bothLight: 'التطبيقات والنظام في الوضع الفاتح',
  refreshStatus: 'تحديث الحالة',
  hideToTrayHint: 'تلميح: إغلاق النافذة يخفي التطبيق في شريط النظام بدل إنهائه.',
  moreInfo: 'مزيد من المعلومات',
  registryPath: 'مسار السجل',
  language: 'اللغة',
  languageAuto: 'تلقائي (اتّباع النظام)',
  effectiveLanguage: 'اللغة الفعالة',
  mixedAppsLabel: 'التطبيقات',
  mixedSystemLabel: 'النظام',
  mixedSeparator: ' | ',
})

const NL_MESSAGES = createMessages({
  subtitle: 'Schakel met één klik tussen donkere/lichte Windows-modus',
  loading: 'Laden…',
  dark: 'Donker',
  light: 'Licht',
  mixed: 'Gemengd',
  bothDark: 'Apps en systeem staan beide in donkere modus',
  bothLight: 'Apps en systeem staan beide in lichte modus',
  refreshStatus: 'Status vernieuwen',
  hideToTrayHint: 'Tip: sluiten verbergt het venster naar de systeemtray in plaats van af te sluiten.',
  moreInfo: 'Meer info',
  registryPath: 'Registerpad',
  language: 'Taal',
  languageAuto: 'Automatisch (Systeem volgen)',
  effectiveLanguage: 'Actieve taal',
  mixedAppsLabel: 'Apps',
  mixedSystemLabel: 'Systeem',
  mixedSeparator: ' | ',
})

const DA_MESSAGES = createMessages({
  subtitle: 'Skift mellem mørk/lys Windows-tilstand med ét klik',
  loading: 'Indlæser…',
  dark: 'Mørk',
  light: 'Lys',
  mixed: 'Blandet',
  bothDark: 'Apps og system er begge i mørk tilstand',
  bothLight: 'Apps og system er begge i lys tilstand',
  refreshStatus: 'Opdater status',
  hideToTrayHint: 'Tip: Når vinduet lukkes, skjules appen i systembakken i stedet for at afslutte.',
  moreInfo: 'Mere info',
  registryPath: 'Registreringssti',
  language: 'Sprog',
  languageAuto: 'Auto (Følg system)',
  effectiveLanguage: 'Aktivt sprog',
  mixedAppsLabel: 'Apps',
  mixedSystemLabel: 'System',
  mixedSeparator: ' | ',
})

const FI_MESSAGES = createMessages({
  subtitle: 'Vaihda Windowsin tumma/vaalea tila yhdellä napsautuksella',
  loading: 'Ladataan…',
  dark: 'Tumma',
  light: 'Vaalea',
  mixed: 'Sekoitettu',
  bothDark: 'Sovellukset ja järjestelmä ovat tummassa tilassa',
  bothLight: 'Sovellukset ja järjestelmä ovat vaaleassa tilassa',
  refreshStatus: 'Päivitä tila',
  hideToTrayHint: 'Vinkki: ikkunan sulkeminen piilottaa sovelluksen tarjottimeen poistumisen sijaan.',
  moreInfo: 'Lisätietoja',
  registryPath: 'Rekisteripolku',
  language: 'Kieli',
  languageAuto: 'Automaattinen (Seuraa järjestelmää)',
  effectiveLanguage: 'Aktiivinen kieli',
  mixedAppsLabel: 'Sovellukset',
  mixedSystemLabel: 'Järjestelmä',
  mixedSeparator: ' | ',
})

const NB_MESSAGES = createMessages({
  subtitle: 'Bytt mellom mørk/lys Windows-modus med ett klikk',
  loading: 'Laster inn…',
  dark: 'Mørk',
  light: 'Lys',
  mixed: 'Blandet',
  bothDark: 'Apper og system er begge i mørk modus',
  bothLight: 'Apper og system er begge i lys modus',
  refreshStatus: 'Oppdater status',
  hideToTrayHint:
    'Tips: når vinduet lukkes, skjules appen i systemstatusfeltet i stedet for å avsluttes.',
  moreInfo: 'Mer informasjon',
  registryPath: 'Registersti',
  language: 'Språk',
  languageAuto: 'Auto (Følg system)',
  effectiveLanguage: 'Aktivt språk',
  mixedAppsLabel: 'Apper',
  mixedSystemLabel: 'System',
  mixedSeparator: ' | ',
})

const SV_MESSAGES = createMessages({
  subtitle: 'Växla Windows mörkt/ljust läge med ett klick',
  loading: 'Läser in…',
  dark: 'Mörk',
  light: 'Ljus',
  mixed: 'Blandat',
  bothDark: 'Appar och system är i mörkt läge',
  bothLight: 'Appar och system är i ljust läge',
  refreshStatus: 'Uppdatera status',
  hideToTrayHint: 'Tips: att stänga fönstret döljer appen i systemfältet i stället för att avsluta.',
  moreInfo: 'Mer information',
  registryPath: 'Registersökväg',
  language: 'Språk',
  languageAuto: 'Auto (Följ systemet)',
  effectiveLanguage: 'Aktivt språk',
  mixedAppsLabel: 'Appar',
  mixedSystemLabel: 'System',
  mixedSeparator: ' | ',
})

const MESSAGES_BY_LANGUAGE: Record<InstallerLanguage, Messages> = {
  English: EN_MESSAGES,
  SimpChinese: ZH_CN_MESSAGES,
  TradChinese: ZH_TW_MESSAGES,
  Japanese: JA_MESSAGES,
  Korean: KO_MESSAGES,
  Thai: TH_MESSAGES,
  Vietnamese: VI_MESSAGES,
  Indonesian: ID_MESSAGES,
  French: FR_MESSAGES,
  German: DE_MESSAGES,
  Italian: IT_MESSAGES,
  Spanish: ES_MESSAGES,
  SpanishInternational: ES_INTL_MESSAGES,
  Portuguese: PT_MESSAGES,
  PortugueseBR: PT_BR_MESSAGES,
  Russian: RU_MESSAGES,
  Polish: PL_MESSAGES,
  Turkish: TR_MESSAGES,
  Ukrainian: UK_MESSAGES,
  Czech: CS_MESSAGES,
  Hungarian: HU_MESSAGES,
  Greek: EL_MESSAGES,
  Bulgarian: BG_MESSAGES,
  Romanian: RO_MESSAGES,
  Arabic: AR_MESSAGES,
  Dutch: NL_MESSAGES,
  Danish: DA_MESSAGES,
  Finnish: FI_MESSAGES,
  Norwegian: NB_MESSAGES,
  Swedish: SV_MESSAGES,
}

export const getMessages = (language: string): Messages => {
  const key = language as InstallerLanguage
  return MESSAGES_BY_LANGUAGE[key] ?? EN_MESSAGES
}

const LANGUAGE_OPTION_LABELS: Record<InstallerLanguage, string> = {
  English: 'English',
  SimpChinese: '简体中文',
  TradChinese: '繁體中文',
  Japanese: '日本語',
  Korean: '한국어',
  Thai: 'ไทย',
  Vietnamese: 'Tiếng Việt',
  Indonesian: 'Bahasa Indonesia',
  French: 'Français',
  German: 'Deutsch',
  Italian: 'Italiano',
  Spanish: 'Español (España)',
  SpanishInternational: 'Español (Internacional)',
  Portuguese: 'Português (Portugal)',
  PortugueseBR: 'Português (Brasil)',
  Russian: 'Русский',
  Polish: 'Polski',
  Turkish: 'Türkçe',
  Ukrainian: 'Українська',
  Czech: 'Čeština',
  Hungarian: 'Magyar',
  Greek: 'Ελληνικά',
  Bulgarian: 'Български',
  Romanian: 'Română',
  Arabic: 'العربية',
  Dutch: 'Nederlands',
  Danish: 'Dansk',
  Finnish: 'Suomi',
  Norwegian: 'Norsk',
  Swedish: 'Svenska',
}

export const getLanguageOptionLabel = (language: string): string => {
  const key = language as InstallerLanguage
  return LANGUAGE_OPTION_LABELS[key] ?? language
}

export const getLanguageMenuLabel = (languageLabel: string, currentLanguage: string): string => {
  if (currentLanguage === 'English' || languageLabel === 'Language') {
    return languageLabel
  }

  return `${languageLabel} (Language)`
}

const LANGUAGE_TO_LOCALE: Record<InstallerLanguage, string> = {
  English: 'en-US',
  SimpChinese: 'zh-CN',
  TradChinese: 'zh-TW',
  Japanese: 'ja-JP',
  Korean: 'ko-KR',
  Thai: 'th-TH',
  Vietnamese: 'vi-VN',
  Indonesian: 'id-ID',
  French: 'fr-FR',
  German: 'de-DE',
  Italian: 'it-IT',
  Spanish: 'es-ES',
  SpanishInternational: 'es-419',
  Portuguese: 'pt-PT',
  PortugueseBR: 'pt-BR',
  Russian: 'ru-RU',
  Polish: 'pl-PL',
  Turkish: 'tr-TR',
  Ukrainian: 'uk-UA',
  Czech: 'cs-CZ',
  Hungarian: 'hu-HU',
  Greek: 'el-GR',
  Bulgarian: 'bg-BG',
  Romanian: 'ro-RO',
  Arabic: 'ar-SA',
  Dutch: 'nl-NL',
  Danish: 'da-DK',
  Finnish: 'fi-FI',
  Norwegian: 'nb-NO',
  Swedish: 'sv-SE',
}

export const toLanguageLocale = (language: string): string => {
  const key = language as InstallerLanguage
  return LANGUAGE_TO_LOCALE[key] ?? 'en-US'
}

export const getLanguageDisplayName = (language: string): string => {
  const locale = toLanguageLocale(language)

  try {
    const displayName = new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
    return displayName ?? getLanguageOptionLabel(language)
  } catch {
    return getLanguageOptionLabel(language)
  }
}
