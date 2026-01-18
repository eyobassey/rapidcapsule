
export default {
  basicInfo: state => state.currentUser.profile,

  practice: state => state.currentUser.professional_practice,

  certificates: state => state.currentUser.documents.map(doc => ({
    ...doc, file: doc, documentType: doc.original_name
  })),
};
