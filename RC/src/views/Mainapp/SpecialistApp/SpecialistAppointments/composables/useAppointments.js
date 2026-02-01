/**
 * Specialist Appointments - Appointments State Management
 * Handles appointment listing, filtering, and CRUD operations
 */

import { ref, reactive, computed, inject } from 'vue';
import { useToast } from 'vue-toast-notification';

export function useAppointments() {
  const $http = inject('$_HTTP');
  const toast = useToast();

  // State
  const appointments = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const totalCount = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);

  // Filters
  const filters = reactive({
    status: '',         // confirmed, pending, completed, cancelled, no_show
    type: '',           // consultation type
    appointmentType: '', // alias for type (used in UI)
    channel: '',        // video, audio, chat, phone
    dateFrom: '',
    dateTo: '',
    dateRange: '',      // today, week, month
    search: '',
    view: 'all',        // all, today, upcoming, past, needs_action
  });

  // Status counts for stats cards
  const statusCounts = reactive({
    total: 0,
    confirmed: 0,
    completed: 0,
    noShow: 0,
    today: 0,
  });

  // Selected appointments for bulk operations
  const selectedIds = ref([]);

  // Dashboard stats
  const dashboardStats = reactive({
    today: 0,
    thisWeek: 0,
    pendingFollowUps: 0,
    revenueThisMonth: 0,
    walletBalance: 0,
    totalEarnings: 0,
    todayAppointments: [],
    upcomingAppointments: [],
    recentActivity: [],
    weeklyData: [], // For charts
    completedThisMonth: 0,
    missedThisMonth: 0,
    // Raw data for week navigation
    allAppointmentsData: [],
    completedAppointmentsData: [],
  });

  // Filter options (fetched from DB)
  const filterOptions = reactive({
    statuses: [],             // Appointment statuses from backend
    channels: [],             // Meeting channels from backend
    consultationServices: [], // Appointment types from DB
    dateRanges: [],           // Date range presets
    isLoading: false,
  });

  // Computed
  const hasFilters = computed(() => {
    return filters.status || filters.type || filters.channel ||
           filters.dateFrom || filters.dateTo || filters.search;
  });

  const selectedCount = computed(() => selectedIds.value.length);

  const hasSelection = computed(() => selectedIds.value.length > 0);

  // Fetch appointments list
  async function fetchAppointments(page = 1) {
    isLoading.value = true;
    error.value = null;

    try {
      const params = {
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.appointmentType && { type: filters.appointmentType }),
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.search && { search: filters.search }),
      };

      const { data } = await $http.$_getSpecialistAppointments(params);

      // Backend returns array directly or in data.data
      let allAppointments = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

      // Apply search filter on client side if backend doesn't support it
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        allAppointments = allAppointments.filter(a => {
          const patientName = `${a.patient?.profile?.first_name || ''} ${a.patient?.profile?.last_name || ''}`.toLowerCase();
          return patientName.includes(searchLower);
        });
      }

      // Apply appointment type filter on client side (backend doesn't support it)
      const typeFilter = filters.type || filters.appointmentType;
      if (typeFilter) {
        const typeFilterLower = typeFilter.toLowerCase();
        allAppointments = allAppointments.filter(a => {
          const appointmentType = (a.appointment_type || '').toLowerCase();
          return appointmentType === typeFilterLower;
        });
      }

      // Sort by start_time descending (most recent first)
      allAppointments.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

      // Store total count before pagination
      totalCount.value = allAppointments.length;

      // Apply client-side pagination
      const startIndex = (page - 1) * pageSize.value;
      const endIndex = startIndex + pageSize.value;
      appointments.value = allAppointments.slice(startIndex, endIndex);
      currentPage.value = page;

      // Fetch status counts
      await fetchStatusCounts();
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      error.value = 'Failed to load appointments';
      toast.error('Failed to load appointments');
    } finally {
      isLoading.value = false;
    }
  }

  // Fetch status counts for stats cards
  async function fetchStatusCounts() {
    try {
      // Fetch all appointments (up to 500) to compute counts
      const allRes = await $http.$_getSpecialistAppointments({ limit: 500 });
      const allAppointments = allRes.data?.data || [];

      // Compute counts from the full list
      statusCounts.total = allAppointments.length;
      statusCounts.confirmed = allAppointments.filter(a =>
        a.status === 'OPEN' || a.status === 'ONGOING' || a.status === 'RESCHEDULED'
      ).length;
      statusCounts.completed = allAppointments.filter(a => a.status === 'COMPLETED').length;
      statusCounts.noShow = allAppointments.filter(a => a.status === 'MISSED').length;

      // Calculate today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      statusCounts.today = allAppointments.filter(a => {
        const appointmentDate = new Date(a.start_time);
        return appointmentDate >= today && appointmentDate < tomorrow;
      }).length;
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  }

  // Fetch filter options from database (statuses, channels, consultation services, date ranges)
  async function fetchFilterOptions() {
    filterOptions.isLoading = true;
    try {
      const { data } = await $http.$_getAppointmentFilterOptions();
      const options = data?.data || {};

      // Populate all filter options from API response
      filterOptions.statuses = options.statuses || [];
      filterOptions.channels = options.channels || [];
      filterOptions.consultationServices = options.consultationServices || [];
      filterOptions.dateRanges = options.dateRanges || [];
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
      // Fallback to defaults - UI will handle gracefully
      filterOptions.statuses = [];
      filterOptions.channels = [];
      filterOptions.consultationServices = [];
      filterOptions.dateRanges = [];
    } finally {
      filterOptions.isLoading = false;
    }
  }

  // Fetch single appointment
  async function fetchAppointment(id) {
    isLoading.value = true;
    error.value = null;

    try {
      const { data } = await $http.$_getAppointmentById(id);
      return data.data || null;
    } catch (err) {
      console.error('Failed to fetch appointment:', err);
      error.value = 'Failed to load appointment details';
      toast.error('Failed to load appointment details');
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Fetch dashboard data
  async function fetchDashboard() {
    isLoading.value = true;

    try {
      // Fetch enhanced dashboard data (includes wallet, activity, earnings)
      const [enhancedRes, openRes, completedRes, missedRes] = await Promise.all([
        $http.$_getSpecialistDashboardEnhanced().catch(() => ({ data: {} })),
        $http.$_getSpecialistAppointments({ status: 'OPEN' }),
        $http.$_getSpecialistAppointments({ status: 'COMPLETED' }),
        $http.$_getSpecialistAppointments({ status: 'MISSED' }).catch(() => ({ data: { data: [] } })),
      ]);

      // Enhanced dashboard data
      const enhanced = enhancedRes.data?.data || enhancedRes.data || {};
      dashboardStats.walletBalance = enhanced.wallet?.balance || 0;
      dashboardStats.totalEarnings = enhanced.wallet?.totalEarnings || 0;
      dashboardStats.revenueThisMonth = enhanced.wallet?.totalEarnings || 0;
      dashboardStats.recentActivity = enhanced.recentActivity || [];

      // Open appointments
      const allAppointments = openRes.data?.data || [];
      const completedData = completedRes.data?.data || [];
      const missedData = missedRes.data?.data || [];

      // Store raw data for week navigation in Dashboard
      dashboardStats.allAppointmentsData = allAppointments;
      dashboardStats.completedAppointmentsData = completedData;

      // Filter for today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      dashboardStats.todayAppointments = allAppointments.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= today && aptDate < tomorrow;
      }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      dashboardStats.today = dashboardStats.todayAppointments.length;

      // Upcoming appointments (next 5, excluding today)
      dashboardStats.upcomingAppointments = allAppointments
        .filter((apt) => new Date(apt.start_time) >= tomorrow)
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 5);

      // Filter for this week's appointments
      const weekStart = getWeekStart(new Date());
      const weekEnd = getWeekEnd(new Date());
      weekEnd.setHours(23, 59, 59, 999);

      const weekAppointments = allAppointments.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });

      dashboardStats.thisWeek = weekAppointments.length;

      // Completed this month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      dashboardStats.completedThisMonth = completedData.filter((apt) => {
        return new Date(apt.start_time) >= monthStart;
      }).length;

      // Missed this month
      dashboardStats.missedThisMonth = missedData.filter((apt) => {
        return new Date(apt.start_time) >= monthStart;
      }).length;

      // Follow-ups (completed in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dashboardStats.pendingFollowUps = completedData.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        return aptDate >= sevenDaysAgo;
      }).length;

      // Weekly data for chart (last 7 days)
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayCompleted = completedData.filter((apt) => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= date && aptDate < nextDate;
        }).length;

        const dayScheduled = allAppointments.filter((apt) => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= date && aptDate < nextDate;
        }).length;

        weeklyData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          completed: dayCompleted,
          scheduled: dayScheduled,
        });
      }
      dashboardStats.weeklyData = weeklyData;

    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      isLoading.value = false;
    }
  }

  // Reschedule appointment
  async function rescheduleAppointment(id, newDate, newTime, reason, notifyPatient = true) {
    try {
      const response = await $http.$_rescheduleAppointments({
        appointmentId: id,
        date: newDate,
        time: newTime,
        reason,
        notify_patient: notifyPatient,
      });

      if (response.data?.success) {
        toast.success('Appointment rescheduled successfully');
        await fetchAppointments(currentPage.value);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to reschedule:', err);
      toast.error(err.response?.data?.message || 'Failed to reschedule appointment');
      return false;
    }
  }

  // Cancel appointment
  async function cancelAppointment(id, reason, refundOption, offerReschedule = false, notifyPatient = true) {
    try {
      const response = await $http.$_cancelAppointment(id, {
        reason,
        refund_option: refundOption,
        offer_reschedule: offerReschedule,
        notify_patient: notifyPatient,
      });

      if (response.data?.success) {
        toast.success('Appointment cancelled');
        await fetchAppointments(currentPage.value);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to cancel:', err);
      toast.error('Failed to cancel appointment');
      return false;
    }
  }

  // Toggle selection
  function toggleSelection(id) {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
      selectedIds.value.splice(index, 1);
    } else {
      selectedIds.value.push(id);
    }
  }

  // Select all visible
  function selectAll() {
    selectedIds.value = appointments.value.map(a => a._id);
  }

  // Clear selection
  function clearSelection() {
    selectedIds.value = [];
  }

  // Apply filter
  function applyFilter(key, value) {
    filters[key] = value;
    fetchAppointments(1);
  }

  // Clear all filters
  function clearFilters() {
    Object.keys(filters).forEach(key => {
      if (key !== 'view') filters[key] = '';
    });
    fetchAppointments(1);
  }

  // Set view (tab)
  function setView(view) {
    filters.view = view;
    fetchAppointments(1);
  }

  // Helper functions
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getWeekEnd(date) {
    const start = getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  return {
    // State
    appointments,
    isLoading,
    error,
    totalCount,
    currentPage,
    pageSize,
    filters,
    selectedIds,
    dashboardStats,
    statusCounts,
    filterOptions,

    // Computed
    hasFilters,
    selectedCount,
    hasSelection,

    // Methods
    fetchAppointments,
    fetchAppointment,
    fetchDashboard,
    fetchStatusCounts,
    fetchFilterOptions,
    rescheduleAppointment,
    cancelAppointment,
    toggleSelection,
    selectAll,
    clearSelection,
    applyFilter,
    clearFilters,
    setView,
  };
}
