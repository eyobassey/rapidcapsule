export default [
    '8:00',
    '8:30',
    '9:00',
    '9:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
    '23:30',
    '0:00',
    '0:30',
    '1:00',
    '1:30',
    '2:00',
    '2:30',
    '3:00',
    '3:30',
    '4:00',
    '4:30',
    '5:00',
    '5:30',
    '6:00',
    '6:30',
    '7:00',
    '7:30',
]

export function useTimesInBetween(date = new Date(), startTime, endTime) {
  const timesInBetween = [];

  const newDate = new Date(date);
  const startH = parseInt(startTime.split(":")[0]);
  const startM = parseInt(startTime.split(":")[1]);
  const endH = parseInt(endTime.split(":")[0]);
  const endM = parseInt(endTime.split(":")[1]);

  if (startM == 30) startH++;

  for (let i = startH; i < endH; i++) {
    timesInBetween.push(i < 10 ? "0" + i + ":00" : i + ":00");
    timesInBetween.push(i < 10 ? "0" + i + ":30" : i + ":30");
  }

  timesInBetween.push(endH + ":00");
  if (endM == 30) timesInBetween.push(endH + ":30")

  timesInBetween.map((timeString) => {
    let H = +timeString.substr(0, 2);
    let h = (H % 12) || 12;
    let ampm = H < 12 ? " AM" : " PM";
    return timeString = h + timeString.substr(2, 3) + ampm;
  });

  return timesInBetween.map(time => new Date(Date.UTC(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      parseInt(time.split(":")[0]), parseInt(time.split(":")[1])
  )));
}