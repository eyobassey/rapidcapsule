import axios from "axios";

export function useFormatDateMixed(date, lang) {
  console.log(date);

  let dateVal = new Date(date);
  let year = dateVal.getFullYear();
  let month = dateVal.toLocaleString(lang, { month: "short" });
  let day = dateVal.getDate().toString().padStart(2, "0");

  return `${day} ${month}, ${year}`;
}

export function useFormatDateNumbers(date) {
  let dateVal = new Date(date);
  let year = dateVal.getFullYear();
  let month = (dateVal.getMonth() + 1).toString().padStart(2, "0");
  let day = dateVal.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function useCalcTimeEllapsed(val) {
  let now = Date.now();
  let nowDate = new Date(now);
  let updatedAt = new Date(val);
  let dayDiff = Math.floor((nowDate - updatedAt) / 86400000);
  let minsDiff = nowDate.getMinutes() - updatedAt.getMinutes();
  let hrsDiff = nowDate.getHours() - updatedAt.getHours();
  let mnthDiff = nowDate.getMonth() - updatedAt.getMonth();

  if (dayDiff == 0) {
    if (hrsDiff == 0) {
      return `${minsDiff > 0 ? minsDiff : ""} ${
        minsDiff < 1 ? "Just now" : minsDiff > 1 ? "mins ago" : "min ago"
      }`;
    } else {
      return `${hrsDiff} ${hrsDiff > 1 ? "hrs ago" : "hr ago"}`;
    }
  } else if (dayDiff > 0 && dayDiff < 7) {
    return `${dayDiff} ${dayDiff > 1 ? "days ago" : "day ago"}`;
  } else if (dayDiff >= 7 && dayDiff < 14) {
    return `${Math.floor(dayDiff / 7)} week ago`;
  } else if (dayDiff >= 14 && dayDiff < 21) {
    return `${Math.floor(dayDiff / 7)} weeks ago`;
  } else if (dayDiff >= 21 && dayDiff < 28) {
    return `${Math.floor(dayDiff / 7)} weeks ago`;
  } else if (dayDiff >= 28) {
    return `${mnthDiff} ${mnthDiff > 1 ? "months ago" : "month ago"}`;
  }
}

export async function useConvertToFile(array) {
  const newFileList = new DataTransfer();

  for (let item of array) {
    let blob = item.url.split(",")[1];

    let file = new File([blob], item.original_name, { type: item.file_type });
    newFileList.items.add(file);
  }

  return newFileList.files;
}

export async function useConvertToBase64(filelist) {
  let files = [];

  if (filelist) {
    for (let file of filelist) {
      let readFile = await new Promise((resolve, reject) => {
        try {
          let reader = new FileReader();

          reader.readAsDataURL(file);

          reader.onload = (event) => {
            let fileObj = {
              original_name: file.name,
              url: event.target.result,
              file_type: file.type,
            };

            resolve(fileObj);
          };
        } catch (err) {
          reject(err);
        }
      });

      files.push(readFile);
    }
  }

  return files;
}

export async function useImageToBase64(img) {
  let image = null;

  if (img) {
    let readFile = await new Promise((resolve, reject) => {
      try {
        let reader = new FileReader();

        reader.readAsDataURL(img);

        reader.onload = (event) => {
          let imageURL = event.target.result;
          resolve(imageURL);
        };
      } catch (err) {
        reject(err);
      }
    });

    image = readFile;
  }

  return image;
}

export function formatNumber(number) {
  return number.split("-").join("");
}
