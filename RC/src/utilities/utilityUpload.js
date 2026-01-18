export const fileSize = (a,b,c,d,e) => {
    return (b=Math,c=b.log,d=1e3,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)+' '+(e?'kMGTPEZY'[--e]+'B':'Bytes')
};

export const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

export const onFileChange = async ($event, array) => {
    [...$event?.target?.files].forEach(async (file) => {
        array.push({
            original_name: file.name?.replace(/\.[^/.]+$/, ''),
            url: await fileToBase64(file),
            type_of_document: file.type,
            file_size: file.size
        });
    });
};