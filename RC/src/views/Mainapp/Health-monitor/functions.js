export const handleImageUploadToCloudinary = async (fileForm) => {
  try {
    const URL = process.env.VUE_APP_CLOUDINARY_URL;
    const response = await fetch(`${URL}/oj/image/upload`, {
      method: "POST",
      body: fileForm,
    }).then((res) => res.json());

    return response.secure_url || "";
  } catch (e) {
    console.log(e);
  }
};
