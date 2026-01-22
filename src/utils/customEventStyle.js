/**
 * src/utils/customEventStyle.js
 * 
 * Purpose: Centralized custom reminder icon/color defaults and helpers.
 * Key responsibility and main functionality: Provide icon/color options and
 * lookup helpers for consistent custom reminder rendering across the UI.
 * 
 * Changelog:
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

export const CUSTOM_EVENT_ICON_OPTIONS = [
    { value: 'event', label: 'Event', Icon: EventAvailableRoundedIcon },
    { value: 'alert', label: 'Alert', Icon: NotificationsActiveRoundedIcon },
    { value: 'alarm', label: 'Alarm', Icon: AlarmRoundedIcon },
    { value: 'timer', label: 'Timer', Icon: AccessTimeRoundedIcon },
    { value: 'play', label: 'Play', Icon: PlayArrowRoundedIcon },
    { value: 'pause', label: 'Pause', Icon: PauseRoundedIcon },
    { value: 'long', label: 'Long', Icon: TrendingUpRoundedIcon },
    { value: 'short', label: 'Short', Icon: TrendingDownRoundedIcon },
    { value: 'lock', label: 'Lock', Icon: LockRoundedIcon },
    { value: 'unlock', label: 'Unlock', Icon: LockOpenRoundedIcon },
    { value: 'watch', label: 'Watch', Icon: VisibilityRoundedIcon },
    { value: 'hide', label: 'Hide', Icon: VisibilityOffRoundedIcon },
    { value: 'food', label: 'Food', Icon: RestaurantRoundedIcon },
    { value: 'gym', label: 'Gym', Icon: FitnessCenterRoundedIcon },
    { value: 'home', label: 'Home', Icon: HomeRoundedIcon },
    { value: 'pet', label: 'Pet', Icon: PetsRoundedIcon },
    { value: 'add', label: 'Add', Icon: AddCircleRoundedIcon },
    { value: 'remove', label: 'Remove', Icon: RemoveCircleRoundedIcon },
    { value: 'confirm', label: 'Confirm', Icon: CheckCircleRoundedIcon },
    { value: 'edit', label: 'Edit', Icon: EditRoundedIcon },
    { value: 'risk', label: 'Risk', Icon: ReportProblemRoundedIcon },
    { value: 'protect', label: 'Protect', Icon: ShieldRoundedIcon },
    { value: 'momentum', label: 'Momentum', Icon: BoltRoundedIcon },
    { value: 'insights', label: 'Insights', Icon: InsightsRoundedIcon },
    { value: 'stats', label: 'Stats', Icon: AssessmentRoundedIcon },
    { value: 'chart', label: 'Chart', Icon: ShowChartRoundedIcon },
    { value: 'timeline', label: 'Timeline', Icon: TimelineRoundedIcon },
    { value: 'blocked', label: 'Blocked', Icon: BlockRoundedIcon },
    { value: 'money', label: 'Money', Icon: AttachMoneyRoundedIcon },
    { value: 'savings', label: 'Savings', Icon: SavingsRoundedIcon },
    { value: 'bank', label: 'Bank', Icon: AccountBalanceRoundedIcon },
    { value: 'psych', label: 'Psych', Icon: PsychologyRoundedIcon },
    { value: 'launch', label: 'Launch', Icon: RocketLaunchRoundedIcon },
    { value: 'flag', label: 'Flag', Icon: FlagRoundedIcon },
    { value: 'close', label: 'Close', Icon: CloseRoundedIcon },
    { value: 'cancel', label: 'Cancel', Icon: CancelRoundedIcon },
];

export const getCustomEventIconComponent = (value) => {
    const match = CUSTOM_EVENT_ICON_OPTIONS.find((option) => option.value === value);
    return match?.Icon || EventAvailableRoundedIcon;
};

export const resolveCustomEventColor = (color, theme) => {
    if (color) return color;
    return theme?.palette?.primary?.main || DEFAULT_CUSTOM_EVENT_COLOR;
};
