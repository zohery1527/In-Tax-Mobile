// components/Icons.tsx
import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: any;
}
export const Verified = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="verified" size={size} color={color} style={style} />
);

export const CheckCircle = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="check-circle" size={size} color={color} style={style} />
);

export const Mic = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="mic" size={size} color={color} style={style} />
);

export const Scan = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="maximize" size={size} color={color} style={style} />
);

export const ExternalLink = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="external-link" size={size} color={color} style={style} />
);

export const ChevronRight = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="chevron-right" size={size} color={color} style={style} />
);

export const Rocket = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="rocket" size={size} color={color} style={style} />
);

export const Trophy = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="trophy" size={size} color={color} style={style} />
);
// ==================== ICÔNES PRINCIPALES ====================
export const Home = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="home" size={size} color={color} style={style} />
);

export const User = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="user" size={size} color={color} style={style} />
);

export const Phone = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="phone" size={size} color={color} style={style} />
);

export const Shield = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="shield" size={size} color={color} style={style} />
);

export const Check = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="check" size={size} color={color} style={style} />
);

export const ArrowLeft = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="arrow-left" size={size} color={color} style={style} />
);

// ==================== AUTHENTIFICATION ====================
export const Login = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="login" size={size} color={color} style={style} />
);

export const Logout = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="logout" size={size} color={color} style={style} />
);

export const Register = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="person-add" size={size} color={color} style={style} />
);

export const Key = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="key" size={size} color={color} style={style} />
);

export const Lock = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="lock" size={size} color={color} style={style} />
);

export const Eye = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="eye" size={size} color={color} style={style} />
);

export const EyeOff = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="eye-off" size={size} color={color} style={style} />
);

// ==================== DÉCLARATIONS ET FISCALITÉ ====================
export const Document = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="description" size={size} color={color} style={style} />
);

export const Tax = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="file-invoice-dollar" size={size} color={color} style={style} />
);

export const Calculator = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="calculate" size={size} color={color} style={style} />
);

export const Euro = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="euro-sign" size={size} color={color} style={style} />
);

export const Money = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="money-bill-wave" size={size} color={color} style={style} />
);

export const Bank = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialCommunityIcons name="bank" size={size} color={color} style={style} />
);

export const Percent = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialCommunityIcons name="percent" size={size} color={color} style={style} />
);

export const Chart = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="bar-chart" size={size} color={color} style={style} />
);

// ==================== PAIEMENTS ====================
export const Payment = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="payment" size={size} color={color} style={style} />
);

export const CreditCard = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="credit-card" size={size} color={color} style={style} />
);

export const MobilePayment = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="smartphone" size={size} color={color} style={style} />
);

export const OrangeMoney = ({ size = 24, style }: IconProps) => (
  <MaterialIcons name="attach-money" size={size} color="#FF6600" style={style} />
);

export const MVola = ({ size = 24, color = '#00B894', style }: IconProps) => (
  <FontAwesome5 name="mobile-alt" size={size} color={color} style={style} />
);

export const AirtelMoney = ({ size = 24, color = '#E40F0F', style }: IconProps) => (
  <MaterialCommunityIcons name="cellphone" size={size} color={color} style={style} />
);



export const Send = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="send" size={size} color={color} style={style} />
);

export const QrCode = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="qr-code" size={size} color={color} style={style} />
);

// ==================== NOTIFICATIONS ====================
export const Bell = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="bell" size={size} color={color} style={style} />
);

export const BellOff = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="bell-off" size={size} color={color} style={style} />
);

export const Alert = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="alert-circle" size={size} color={color} style={style} />
);

export const Info = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="info" size={size} color={color} style={style} />
);

export const Warning = ({ size = 24, color = '#f39c12', style }: IconProps) => (
  <Feather name="alert-triangle" size={size} color={color} style={style} />
);

export const Error = ({ size = 24, color = '#e74c3c', style }: IconProps) => (
  <MaterialIcons name="error-outline" size={size} color={color} style={style} />
);

// ==================== NAVIGATION ET ACTIONS ====================
export const Menu = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="menu" size={size} color={color} style={style} />
);

export const Settings = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="settings" size={size} color={color} style={style} />
);

export const Search = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="search" size={size} color={color} style={style} />
);

export const Filter = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="filter" size={size} color={color} style={style} />
);

export const Plus = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="plus" size={size} color={color} style={style} />
);

export const Minus = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="minus" size={size} color={color} style={style} />
);

export const Edit = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="edit" size={size} color={color} style={style} />
);

export const Delete = ({ size = 24, color = '#e74c3c', style }: IconProps) => (
  <MaterialIcons name="delete-outline" size={size} color={color} style={style} />
);

export const Save = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="save" size={size} color={color} style={style} />
);

export const Download = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="download" size={size} color={color} style={style} />
);

export const Upload = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="upload" size={size} color={color} style={style} />
);

export const Share = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="share-2" size={size} color={color} style={style} />
);

// ==================== STATUTS ====================
export const Success = ({ size = 24, color = '#2ecc71', style }: IconProps) => (
  <MaterialIcons name="check-circle" size={size} color={color} style={style} />
);

export const Pending = ({ size = 24, color = '#f39c12', style }: IconProps) => (
  <MaterialIcons name="pending" size={size} color={color} style={style} />
);

export const Cancel = ({ size = 24, color = '#e74c3c', style }: IconProps) => (
  <MaterialIcons name="cancel" size={size} color={color} style={style} />
);

export const Clock = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="clock" size={size} color={color} style={style} />
);

export const Calendar = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="calendar" size={size} color={color} style={style} />
);

// ==================== COMMUNICATION ====================
export const Mail = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="mail" size={size} color={color} style={style} />
);

export const Message = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="message-square" size={size} color={color} style={style} />
);

export const PhoneCall = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="phone-call" size={size} color={color} style={style} />
);

export const Help = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="help-outline" size={size} color={color} style={style} />
);

export const Support = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="support-agent" size={size} color={color} style={style} />
);

// ==================== PROFIL ET COMPTE ====================
export const Profile = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="account-circle" size={size} color={color} style={style} />
);

export const History = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="history" size={size} color={color} style={style} />
);

export const Stats = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="trending-up" size={size} color={color} style={style} />
);

export const Badge = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialCommunityIcons name="badge-account" size={size} color={color} style={style} />
);

export const Certificate = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="verified" size={size} color={color} style={style} />
);

// ==================== GÉOLOCALISATION ====================
export const Map = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="map-pin" size={size} color={color} style={style} />
);

export const Location = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="location-on" size={size} color={color} style={style} />
);

export const Zone = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialCommunityIcons name="map-marker-radius" size={size} color={color} style={style} />
);

// ==================== AUTRES ====================
export const Refresh = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="refresh-cw" size={size} color={color} style={style} />
);

export const Sync = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="sync" size={size} color={color} style={style} />
);

export const Cloud = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="cloud" size={size} color={color} style={style} />
);

export const Wifi = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="wifi" size={size} color={color} style={style} />
);

export const Battery = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="battery-full" size={size} color={color} style={style} />
);

export const AlertCircle = ({ size = 24, color = '#e74c3c', style }: IconProps) => (
  <Feather name="alert-circle" size={size} color={color} style={style} />
);

export const ArrowRight = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="arrow-right" size={size} color={color} style={style} />
);


export const Briefcase = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="briefcase" size={size} color={color} style={style} />
);

export const MapPin = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="map-pin" size={size} color={color} style={style} />
);



/// verify icones:
export const ShieldCheck = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="shield" size={size} color={color} style={style} />
);

export const Clipboard = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="clipboard" size={size} color={color} style={style} />
);

export const Copy = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="copy" size={size} color={color} style={style} />
);



export const ChevronDown = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="chevron-down" size={size} color={color} style={style} />
);

export const AlertTriangle = ({ size = 24, color = '#f39c12', style }: IconProps) => (
  <Feather name="alert-triangle" size={size} color={color} style={style} />
);


// ICÔNES QUE VOUS DEMANDEZ :
export const HelpCircle = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="help-circle" size={size} color={color} style={style} />
);

export const MessageCircle = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="message-circle" size={size} color={color} style={style} />
);

export const Zap = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="zap" size={size} color={color} style={style} />
);
export const Heart = ({ size = 24, color = '#e74c3c', style }: IconProps) => (
  <Feather name="heart" size={size} color={color} style={style} />
);
export const DollarSign = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="dollar-sign" size={size} color={color} style={style} />
);

export const Lightbulb = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="sun" size={size} color={color} style={style} />
  // Note: Feather n'a pas de 'lightbulb', j'utilise 'sun' comme alternative
);

export const Test = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <FontAwesome5 name="flask" size={size} color={color} style={style} />
);

// Icône Stop
export const Stop = ({ size = 24, color = '#e74c3c', style }: IconProps) => (
  <FontAwesome5 name="stop-circle" size={size} color={color} style={style} />
);

export const BarChart = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="bar-chart-2" size={size} color={color} style={style} />
  // ou <MaterialIcons name="bar-chart" size={size} color={color} style={style} />
  // ou <FontAwesome5 name="chart-bar" size={size} color={color} style={style} />
);

export const FileText = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <Feather name="file-text" size={size} color={color} style={style} />
  // ou <FontAwesome5 name="file-alt" size={size} color={color} style={style} />
);

export const BarChart3 = ({ 
  size = 24, 
  color = '#3498db', 
  style 
}: IconProps) => {
  return (
    <Feather 
      name="bar-chart-2"  // "bar-chart-2" est l'équivalent dans Feather
      size={size} 
      color={color} 
      style={style} 
    />
  );
};

export const MessageSquare = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="message" size={size} color={color} style={style} />
);

export const X = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="close" size={size} color={color} style={style} />
);

export const Smartphone = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="smartphone" size={size} color={color} style={style} />
);

export const RefreshCw = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="refresh" size={size} color={color} style={style} />
);


export const Headphones = ({ size = 24, color = '#3498db', style }: IconProps) => (
  <MaterialIcons name="smartphone" size={size} color={color} style={style} />
);


// ==================== COMPOSANT PRINCIPAL ====================
export const Icons = {
  // Authentification
  Headphones,
  MessageSquare,
  Smartphone,
  X,
  Home,
  Stop,
  BarChart,
  Test,
  Heart,
  RefreshCw,
  FileText,
  HelpCircle,
  Zap,
  DollarSign,
  ChevronDown,
  Briefcase,
  MessageCircle,
  Clipboard,
  User,
  Lightbulb,
  Phone,
  Copy,
  MapPin,
  AlertTriangle,
  Shield,
  Check,
  ArrowLeft,
  BarChart3,
  Login,
  Logout,
  ShieldCheck,
  Register,
  Key,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  
  // Fiscalité
  Document,
  Tax,
  Calculator,
  Euro,
  Money,
  Bank,
  Percent,
  Chart,
  
  // Paiements
  Payment,
  CreditCard,
  MobilePayment,
  OrangeMoney,
  MVola,
  AirtelMoney,
  QrCode,
  
  // Notifications
  Bell,
  BellOff,
  Alert,
  Info,
  Warning,
  Error,
  
  // Navigation
  Menu,
  Settings,
  Search,
  Filter,
  Plus,
  Minus,
  Edit,
  Delete,
  Save,
  Download,
  Upload,
  Share,
  
  // Statuts
  Success,
  Pending,
  Cancel,
  Clock,
  Calendar,
  
  // Communication
  Mail,
  Message,
  PhoneCall,
  Help,
  Support,
  
  // Profil
  Profile,
  History,
  Stats,
  Badge,
  Certificate,
  
  // Géolocalisation
  Map,
  Location,
  Zone,
  
  // Divers
  Refresh,
  Sync,
  Cloud,
  Wifi,
  Battery,
  Verified,
  CheckCircle,
  Mic,
  Scan,
  ExternalLink,
  ChevronRight,
  Rocket,
  Send,
  Trophy,
};