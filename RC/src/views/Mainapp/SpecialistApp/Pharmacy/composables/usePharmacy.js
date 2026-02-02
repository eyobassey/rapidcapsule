import { format, formatDistanceToNow, differenceInYears, parseISO, isValid } from 'date-fns';

export function usePharmacy() {
  function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0.00';
    return Number(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(date, pattern = 'MMM d, yyyy') {
    if (!date) return '';
    const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsed)) return '';
    return format(parsed, pattern);
  }

  function formatDateTime(date) {
    return formatDate(date, 'MMM d, yyyy h:mm a');
  }

  function formatRelativeDate(date) {
    if (!date) return '';
    const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsed)) return '';
    return formatDistanceToNow(parsed, { addSuffix: true });
  }

  function formatStatus(status) {
    if (!status) return '';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function calculateAge(dob) {
    if (!dob) return '';
    const parsed = typeof dob === 'string' ? parseISO(dob) : new Date(dob);
    if (!isValid(parsed)) return '';
    const age = differenceInYears(new Date(), parsed);
    return `${age} yrs`;
  }

  function formatPaymentMethod(method) {
    const methods = {
      SPECIALIST_WALLET: 'Wallet Payment',
      PATIENT_ONLINE: 'Patient Online Payment',
      PATIENT_WALLET: 'Patient Wallet',
      PATIENT_CASH: 'Cash Payment',
      SEND_TO_PATIENT: 'Sent to Patient',
    };
    return methods[method] || method || 'Not set';
  }

  function formatPaymentStatus(status) {
    const statuses = {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      COMPLETED: 'Paid',
      FAILED: 'Failed',
      REFUNDED: 'Refunded',
    };
    return statuses[status] || status || 'N/A';
  }

  function getStockClass(drug) {
    if (drug.is_out_of_stock || drug.quantity === 0) return 'out-of-stock';
    if (drug.is_low_stock || drug.quantity <= drug.reorder_level) return 'low-stock';
    return 'in-stock';
  }

  function getStockLabel(drug) {
    if (drug.is_out_of_stock || drug.quantity === 0) return 'Out of Stock';
    if (drug.is_low_stock || drug.quantity <= drug.reorder_level) return 'Low Stock';
    return 'In Stock';
  }

  return {
    formatCurrency,
    formatDate,
    formatDateTime,
    formatRelativeDate,
    formatStatus,
    getInitials,
    calculateAge,
    formatPaymentMethod,
    formatPaymentStatus,
    getStockClass,
    getStockLabel,
  };
}
