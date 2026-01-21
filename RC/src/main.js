import { createApp } from "vue";
import axios from "axios";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import VueCreditCardValidation from "vue-credit-card-validation";
import vueGoogleLogin from "vue3-google-login";
import { setupCalendar, Calendar, DatePicker } from 'v-calendar';

import App from "./App.vue";
import router from "./router";
import store from "./store/data-store";
import apiFactory from "@/services/apiFactory";
import { scrollBarVizDirective } from "./custom-directives";
import ToastPlugin from "vue-toast-notification";
import VueCountdown from "@chenfengyuan/vue-countdown";

import {
	BiCreditCard2Back,
	BiCheckCircleFill,
	IoCallOutline,
	LaFileAlt,
	IoChatboxOutline,
	HiMicrophone,
	HiVideoCamera,
	HiPhone,
	FaRegularFileAlt,
	PxNotesPlus,
	CoSend,
	BiChatSquare,
	BiMicMute,
	BiMic,
	IoMicOffOutline,
	IoVideocamOutline,
	IoVideocamOffOutline,
	BiQuestionLg,
	IoMaleSharp,
	IoFemaleSharp,
	BiCheckCircle,
	MdCancelOutlined,
	BiArrowRight,
	MdLocalhospitalRound,
	BiChevronDown,
	MdAddcircleRound,
	BiStarFill,
	MdArrowupwardRound,
	HiTrendingUp,
	BiClock,
	BiCalendar4Event,
	BiPlus,
	IoMenu,
	FaStethoscope,
	FaCoins,
	// Health Checkup UI icons
	FaHeartbeat,
	FaRobot,
	HiClipboardList,
	HiCheckCircle,
	HiArrowRight,
	HiArrowLeft,
	HiUserAdd,
	HiShieldCheck,
	HiLightningBolt,
	HiClock,
	HiChevronRight,
	HiChevronLeft,
	HiSortDescending,
	HiCalendar,
	HiX,
	HiXCircle,
	BiWallet2,
	HiSparkles,
	HiExclamation,
	HiExclamationCircle,
	// Additional Health Checkup icons
	HiUsers,
	HiSearch,
	HiGlobe,
	HiChat,
	HiInformationCircle,
	HiLightBulb,
	HiCheck,
	HiQuestionMarkCircle,
	HiChevronUp,
	HiChevronDown,
	HiBeaker,
	// Dashboard icons
	HiClipboardCheck,
	HiChartBar,
	HiDocumentText,
	HiMoon,
	BiDropletFill,
	FaRunning,
	FaThermometerHalf,
	FaWeight,
	HiHeart,
	HiPlus,
	HiPencil,
	// Vitals page icons
	HiDownload,
	HiShare,
	HiArrowDown,
	HiArrowUp,
	// Health Score unlock icons
	HiLockClosed,
	HiUser,
	// Account page icons
	HiMail,
	HiKey,
	// Wallet page icons
	HiCog,
	HiShoppingCart,
	HiRefresh,
	RiMedicineBottleLine,
	// Referrals page icons
	HiLink,
	HiGift,
	HiChatAlt2,
	HiCursorClick,
	HiUserGroup,
	HiStar,
	GiTrophy,
	GiCrown,
	HiClipboardCopy,
	// Specialist Appointments vitals icons
	BiActivity,
	GiDrop,
	HiGlobeAlt,
	HiExternalLink,
	HiMinus,
	HiClipboard,
	// Prescriptions tab icons
	RiCapsuleLine,
	HiCreditCard,
	HiAnnotation,
	HiUserCircle,
	HiTruck,
	GiMedicines,
	HiUpload,
	HiLocationMarker,
} from "oh-vue-icons/icons";
addIcons(
	BiCreditCard2Back,
	BiCheckCircleFill,
	IoCallOutline,
	LaFileAlt,
	IoChatboxOutline,
	HiMicrophone,
	HiVideoCamera,
	HiPhone,
	FaRegularFileAlt,
	PxNotesPlus,
	CoSend,
	BiChatSquare,
	BiMicMute,
	BiMic,
	IoMicOffOutline,
	IoVideocamOutline,
	IoVideocamOffOutline,
	BiQuestionLg,
	IoMaleSharp,
	IoFemaleSharp,
	BiCheckCircle,
	MdCancelOutlined,
	BiArrowRight,
	MdLocalhospitalRound,
	BiChevronDown,
	MdAddcircleRound,
	BiStarFill,
	MdArrowupwardRound,
	HiTrendingUp,
	BiClock,
	BiCalendar4Event,
	BiPlus,
	IoMenu,
	FaStethoscope,
	FaCoins,
	// Health Checkup UI icons
	FaHeartbeat,
	FaRobot,
	HiClipboardList,
	HiCheckCircle,
	HiArrowRight,
	HiArrowLeft,
	HiUserAdd,
	HiShieldCheck,
	HiLightningBolt,
	HiClock,
	HiChevronRight,
	HiChevronLeft,
	HiSortDescending,
	HiCalendar,
	HiX,
	HiXCircle,
	BiWallet2,
	HiSparkles,
	HiExclamation,
	HiExclamationCircle,
	// Additional Health Checkup icons
	HiUsers,
	HiSearch,
	HiGlobe,
	HiChat,
	HiInformationCircle,
	HiLightBulb,
	HiCheck,
	HiQuestionMarkCircle,
	HiChevronUp,
	HiChevronDown,
	HiBeaker,
	// Dashboard icons
	HiClipboardCheck,
	HiChartBar,
	HiDocumentText,
	HiMoon,
	BiDropletFill,
	FaRunning,
	FaThermometerHalf,
	FaWeight,
	HiHeart,
	HiPlus,
	HiPencil,
	// Vitals page icons
	HiDownload,
	HiShare,
	HiArrowDown,
	HiArrowUp,
	// Health Score unlock icons
	HiLockClosed,
	HiUser,
	// Account page icons
	HiMail,
	HiKey,
	// Wallet page icons
	HiCog,
	HiShoppingCart,
	HiRefresh,
	RiMedicineBottleLine,
	// Referrals page icons
	HiLink,
	HiGift,
	HiChatAlt2,
	HiCursorClick,
	HiUserGroup,
	HiStar,
	GiTrophy,
	GiCrown,
	HiClipboardCopy,
	// Specialist Appointments vitals icons
	BiActivity,
	GiDrop,
	HiGlobeAlt,
	HiExternalLink,
	HiMinus,
	HiClipboard,
	// Prescriptions tab icons
	RiCapsuleLine,
	HiCreditCard,
	HiAnnotation,
	HiUserCircle,
	HiTruck,
	GiMedicines,
	HiUpload,
	HiLocationMarker,
);

require("@/store/subscriber");

axios.defaults.baseURL = `${process.env.VUE_APP_API_GATEWAY}/api/`;

const app = createApp(App);
app.directive("scrollViz", scrollBarVizDirective);
app.provide("$http", apiFactory);
app.provide("$_HTTP", apiFactory);
app.component("v-icon", OhVueIcon);
app.component('VCalendar', Calendar);
app.component('VDatePicker', DatePicker);
app.use(setupCalendar, {});
app.component(VueCountdown.name, VueCountdown);
app.use(router);
app.use(store);
app.use(VueCreditCardValidation);
app.use(ToastPlugin);
app.use(vueGoogleLogin, {
  clientId: `${process.env.VUE_APP_GOOGLE_KEY}`,
});
app.mount("#app");
