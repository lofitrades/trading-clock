/**
 * src/utils/customEventStyle.js
 * 
 * Purpose: Centralized custom reminder icon/color defaults and helpers.
 * Key responsibility and main functionality: Provide icon/color options and
 * lookup helpers for consistent custom reminder rendering across the UI.
 * 
 * Changelog:
 * v1.4.0 - 2026-01-24 - Phase 2 i18n migration - Migrated 36 icon labels to icons namespace (EN/ES/FR). Added getCustomEventIconOptions(t) factory function to generate dynamic labels using i18n. Old CUSTOM_EVENT_ICON_OPTIONS array deprecated; use getCustomEventIconOptions(t) in components for translated labels.
 * v1.3.5 - 2026-01-22 - Add dog icon next to home.
 * v1.3.4 - 2026-01-22 - Swap volume/expand icons for lifestyle and disabled options.
 * v1.3.3 - 2026-01-22 - Reorder custom icon options with opposing pairs adjacent.
 * v1.3.2 - 2026-01-22 - Add four opposing icon pairs for additional slots.
 * v1.3.1 - 2026-01-22 - Add unlock icon and keep opposing pairs adjacent.
 * v1.3.0 - 2026-01-22 - Add nine additional trading-focused icon options.
 * v1.2.0 - 2026-01-21 - Expand icon options to 18 trading-focused picks.
 * v1.1.0 - 2026-01-21 - Expand icon options for trading workflows.
 * v1.0.0 - 2026-01-21 - Initial implementation for custom reminder icon/color helpers.
 */

import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import AlarmRoundedIcon from '@mui/icons-material/AlarmRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';

export const DEFAULT_CUSTOM_EVENT_ICON = 'event';
export const DEFAULT_CUSTOM_EVENT_COLOR = '#1976d2';

// Icon-to-component mapping (used by getCustomEventIconComponent)
const ICON_COMPONENTS_MAP = {
    event: EventAvailableRoundedIcon,
    alert: NotificationsActiveRoundedIcon,
    alarm: AlarmRoundedIcon,
    timer: AccessTimeRoundedIcon,
    play: PlayArrowRoundedIcon,
    pause: PauseRoundedIcon,
    long: TrendingUpRoundedIcon,
    short: TrendingDownRoundedIcon,
    lock: LockRoundedIcon,
    unlock: LockOpenRoundedIcon,
    watch: VisibilityRoundedIcon,
    hide: VisibilityOffRoundedIcon,
    food: RestaurantRoundedIcon,
    gym: FitnessCenterRoundedIcon,
    home: HomeRoundedIcon,
    pet: PetsRoundedIcon,
    add: AddCircleRoundedIcon,
    remove: RemoveCircleRoundedIcon,
    confirm: CheckCircleRoundedIcon,
    edit: EditRoundedIcon,
    risk: ReportProblemRoundedIcon,
    protect: ShieldRoundedIcon,
    momentum: BoltRoundedIcon,
    insights: InsightsRoundedIcon,
    stats: AssessmentRoundedIcon,
    chart: ShowChartRoundedIcon,
    timeline: TimelineRoundedIcon,
    blocked: BlockRoundedIcon,
    money: AttachMoneyRoundedIcon,
    savings: SavingsRoundedIcon,
    bank: AccountBalanceRoundedIcon,
    psych: PsychologyRoundedIcon,
    launch: RocketLaunchRoundedIcon,
    flag: FlagRoundedIcon,
    close: CloseRoundedIcon,
    cancel: CancelRoundedIcon,
};

/**
 * Factory function to generate icon options with translated labels.
 * Call this from components with useTranslation('icons') to get dynamic labels.
 * 
 * @param {Function} t - Translation function from useTranslation('icons')
 * @returns {Array} Array of icon options with translated labels
 * 
 * Usage:
 * const { t } = useTranslation('icons');
 * const iconOptions = getCustomEventIconOptions(t);
 */
export const getCustomEventIconOptions = (t) => [
    { value: 'event', label: t('event'), Icon: ICON_COMPONENTS_MAP.event },
    { value: 'alert', label: t('alert'), Icon: ICON_COMPONENTS_MAP.alert },
    { value: 'alarm', label: t('alarm'), Icon: ICON_COMPONENTS_MAP.alarm },
    { value: 'timer', label: t('timer'), Icon: ICON_COMPONENTS_MAP.timer },
    { value: 'play', label: t('play'), Icon: ICON_COMPONENTS_MAP.play },
    { value: 'pause', label: t('pause'), Icon: ICON_COMPONENTS_MAP.pause },
    { value: 'long', label: t('long'), Icon: ICON_COMPONENTS_MAP.long },
    { value: 'short', label: t('short'), Icon: ICON_COMPONENTS_MAP.short },
    { value: 'lock', label: t('lock'), Icon: ICON_COMPONENTS_MAP.lock },
    { value: 'unlock', label: t('unlock'), Icon: ICON_COMPONENTS_MAP.unlock },
    { value: 'watch', label: t('watch'), Icon: ICON_COMPONENTS_MAP.watch },
    { value: 'hide', label: t('hide'), Icon: ICON_COMPONENTS_MAP.hide },
    { value: 'food', label: t('food'), Icon: ICON_COMPONENTS_MAP.food },
    { value: 'gym', label: t('gym'), Icon: ICON_COMPONENTS_MAP.gym },
    { value: 'home', label: t('home'), Icon: ICON_COMPONENTS_MAP.home },
    { value: 'pet', label: t('pet'), Icon: ICON_COMPONENTS_MAP.pet },
    { value: 'add', label: t('add'), Icon: ICON_COMPONENTS_MAP.add },
    { value: 'remove', label: t('remove'), Icon: ICON_COMPONENTS_MAP.remove },
    { value: 'confirm', label: t('confirm'), Icon: ICON_COMPONENTS_MAP.confirm },
    { value: 'edit', label: t('edit'), Icon: ICON_COMPONENTS_MAP.edit },
    { value: 'risk', label: t('risk'), Icon: ICON_COMPONENTS_MAP.risk },
    { value: 'protect', label: t('protect'), Icon: ICON_COMPONENTS_MAP.protect },
    { value: 'momentum', label: t('momentum'), Icon: ICON_COMPONENTS_MAP.momentum },
    { value: 'insights', label: t('insights'), Icon: ICON_COMPONENTS_MAP.insights },
    { value: 'stats', label: t('stats'), Icon: ICON_COMPONENTS_MAP.stats },
    { value: 'chart', label: t('chart'), Icon: ICON_COMPONENTS_MAP.chart },
    { value: 'timeline', label: t('timeline'), Icon: ICON_COMPONENTS_MAP.timeline },
    { value: 'blocked', label: t('blocked'), Icon: ICON_COMPONENTS_MAP.blocked },
    { value: 'money', label: t('money'), Icon: ICON_COMPONENTS_MAP.money },
    { value: 'savings', label: t('savings'), Icon: ICON_COMPONENTS_MAP.savings },
    { value: 'bank', label: t('bank'), Icon: ICON_COMPONENTS_MAP.bank },
    { value: 'psych', label: t('psych'), Icon: ICON_COMPONENTS_MAP.psych },
    { value: 'launch', label: t('launch'), Icon: ICON_COMPONENTS_MAP.launch },
    { value: 'flag', label: t('flag'), Icon: ICON_COMPONENTS_MAP.flag },
    { value: 'close', label: t('close'), Icon: ICON_COMPONENTS_MAP.close },
    { value: 'cancel', label: t('cancel'), Icon: ICON_COMPONENTS_MAP.cancel },
];

// DEPRECATED: Use getCustomEventIconOptions(t) instead for translated labels
export const CUSTOM_EVENT_ICON_OPTIONS = [
    { value: 'event', label: 'Event', Icon: ICON_COMPONENTS_MAP.event },
    { value: 'alert', label: 'Alert', Icon: ICON_COMPONENTS_MAP.alert },
    { value: 'alarm', label: 'Alarm', Icon: ICON_COMPONENTS_MAP.alarm },
    { value: 'timer', label: 'Timer', Icon: ICON_COMPONENTS_MAP.timer },
    { value: 'play', label: 'Play', Icon: ICON_COMPONENTS_MAP.play },
    { value: 'pause', label: 'Pause', Icon: ICON_COMPONENTS_MAP.pause },
    { value: 'long', label: 'Long', Icon: ICON_COMPONENTS_MAP.long },
    { value: 'short', label: 'Short', Icon: ICON_COMPONENTS_MAP.short },
    { value: 'lock', label: 'Lock', Icon: ICON_COMPONENTS_MAP.lock },
    { value: 'unlock', label: 'Unlock', Icon: ICON_COMPONENTS_MAP.unlock },
    { value: 'watch', label: 'Watch', Icon: ICON_COMPONENTS_MAP.watch },
    { value: 'hide', label: 'Hide', Icon: ICON_COMPONENTS_MAP.hide },
    { value: 'food', label: 'Food', Icon: ICON_COMPONENTS_MAP.food },
    { value: 'gym', label: 'Gym', Icon: ICON_COMPONENTS_MAP.gym },
    { value: 'home', label: 'Home', Icon: ICON_COMPONENTS_MAP.home },
    { value: 'pet', label: 'Pet', Icon: ICON_COMPONENTS_MAP.pet },
    { value: 'add', label: 'Add', Icon: ICON_COMPONENTS_MAP.add },
    { value: 'remove', label: 'Remove', Icon: ICON_COMPONENTS_MAP.remove },
    { value: 'confirm', label: 'Confirm', Icon: ICON_COMPONENTS_MAP.confirm },
    { value: 'edit', label: 'Edit', Icon: ICON_COMPONENTS_MAP.edit },
    { value: 'risk', label: 'Risk', Icon: ICON_COMPONENTS_MAP.risk },
    { value: 'protect', label: 'Protect', Icon: ICON_COMPONENTS_MAP.protect },
    { value: 'momentum', label: 'Momentum', Icon: ICON_COMPONENTS_MAP.momentum },
    { value: 'insights', label: 'Insights', Icon: ICON_COMPONENTS_MAP.insights },
    { value: 'stats', label: 'Stats', Icon: ICON_COMPONENTS_MAP.stats },
    { value: 'chart', label: 'Chart', Icon: ICON_COMPONENTS_MAP.chart },
    { value: 'timeline', label: 'Timeline', Icon: ICON_COMPONENTS_MAP.timeline },
    { value: 'blocked', label: 'Blocked', Icon: ICON_COMPONENTS_MAP.blocked },
    { value: 'money', label: 'Money', Icon: ICON_COMPONENTS_MAP.money },
    { value: 'savings', label: 'Savings', Icon: ICON_COMPONENTS_MAP.savings },
    { value: 'bank', label: 'Bank', Icon: ICON_COMPONENTS_MAP.bank },
    { value: 'psych', label: 'Psych', Icon: ICON_COMPONENTS_MAP.psych },
    { value: 'launch', label: 'Launch', Icon: ICON_COMPONENTS_MAP.launch },
    { value: 'flag', label: 'Flag', Icon: ICON_COMPONENTS_MAP.flag },
    { value: 'close', label: 'Close', Icon: ICON_COMPONENTS_MAP.close },
    { value: 'cancel', label: 'Cancel', Icon: ICON_COMPONENTS_MAP.cancel },
];

export const getCustomEventIconComponent = (value) => {
    return ICON_COMPONENTS_MAP[value] || ICON_COMPONENTS_MAP.event;
};

export const resolveCustomEventColor = (color, theme) => {
    if (color) return color;
    return theme?.palette?.primary?.main || DEFAULT_CUSTOM_EVENT_COLOR;
};
