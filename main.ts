/**
 * RTC (DS3231) block
 * See also datasheet at: https://www.analog.com/media/en/technical-documentation/data-sheets/ds3231.pdf
 */
//% weight=100 color=#4c97ff icon="\uf017" block="RTC (DS3231)"
namespace DS3231_RTC {
  const I2C_ADDRESS = 0x68;

  const SECONDS_REGISTER = 0x00;
  const MINUTES_REGISTER = 0x01;
  const HOURS_REGISTER = 0x02;
  const WEEKDAY_REGISTER = 0x03;
  const DAY_REGISTER = 0x04;
  const MONTH_REGISTER = 0x05;
  const YEAR_REGISTER = 0x06;

  const CONTROL_REGISTER = 0x0e;
  const STATUS_REGISTER = 0x0f;

  const TEMPERATURE_MSB_REGISTER = 0x11;
  const TEMPERATURE_LSB_REGISTER = 0x12;

  function initialize() {
    setRegister(CONTROL_REGISTER, 0x4c); // Enable the oscillator, allow battery-backed operation, set up interrupts for alarms, and configure a default square-wave frequency
    setRegister(STATUS_REGISTER, 0x08); // Clear alarm flags, clear oscillator stop flag, enable 32kHz Output
  }
  initialize();

  function decToBcd(dec: number): number {
    const tens = Math.floor(dec / 10);
    const ones = dec % 10;
    return (tens << 4) | ones;
  }

  function bcdToDec(bcd: number): number {
    const tens = (bcd >> 4) & 0x0f;
    const ones = bcd & 0x0f;
    return tens * 10 + ones;
  }

  function getRegister(register: number): number {
    let buffer = pins.createBuffer(1);
    buffer[0] = register;
    pins.i2cWriteBuffer(I2C_ADDRESS, buffer);
    return pins.i2cReadNumber(I2C_ADDRESS, NumberFormat.UInt8LE);
  }

  function setRegister(register: number, value: number) {
    let buffer = pins.createBuffer(2);
    buffer[0] = register;
    buffer[1] = value;
    pins.i2cWriteBuffer(I2C_ADDRESS, buffer);
  }

  function padNumber(num: number, size: number): string {
    let s = "" + num;
    while (s.length < size) {
      s = "0" + s;
    }
    return s;
  }

  /**
   * setTime
   */
  //% block="set time to: hours $hours minutes $minutes seconds $seconds"
  //% weight=100 blockGap=8
  //% inlineInputMode=inline
  //% hour.min=0 hour.max=23 mins.min=0 mins.max=59 secs.min=0 secs.max=59
  export function setTime(hours: number, minutes: number, seconds: number) {
    if (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59
    ) {
      setRegister(HOURS_REGISTER, decToBcd(hours));
      setRegister(MINUTES_REGISTER, decToBcd(minutes));
      setRegister(SECONDS_REGISTER, decToBcd(seconds));
    }
  }

  /**
   * timeString
   */
  //% block="time as string"
  //% weight=90 blockGap=8
  export function timeString(): string {
    return (
      padNumber(hours(), 2) +
      ":" +
      padNumber(minutes(), 2) +
      ":" +
      padNumber(seconds(), 2)
    );
  }

  /**
   * Seconds
   */
  //% block="seconds"
  //% weight=80 blockGap=8
  export function seconds(): number {
    return bcdToDec(getRegister(SECONDS_REGISTER));
  }

  /**
   * Minutes
   */
  //% block="minutes"
  //% weight=80 blockGap=8
  export function minutes(): number {
    return bcdToDec(getRegister(MINUTES_REGISTER));
  }

  /**
   * Hours
   */
  //% block="hours"
  //% weight=80 blockGap=8
  export function hours(): number {
    return bcdToDec(getRegister(HOURS_REGISTER));
  }

  /**
   * setDate
   */
  //% block="set date to: weekday $weekday day $day month $month year $year"
  //% weight=70 blockGap=8
  //% inlineInputMode=inline
  //% weekday.min=1 weekday.max=7 day.min=1 day.max=31 month.min=1 month.max=12 year.min=2000 year.max=2099
  export function setDate(
    weekday: number,
    day: number,
    month: number,
    year: number
  ) {
    if (
      weekday >= 1 &&
      weekday <= 7 &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 2000 &&
      year <= 2099
    ) {
      setRegister(WEEKDAY_REGISTER, weekday);
      setRegister(DAY_REGISTER, decToBcd(day));
      setRegister(MONTH_REGISTER, decToBcd(month)); // ignore the century flag
      setRegister(YEAR_REGISTER, decToBcd(year - 2000));
    }
  }

  /**
   * dateString
   */
  //% block="date as string"
  //% weight=60 blockGap=8
  export function dateString(): string {
    return (
      padNumber(day(), 2) +
      "-" +
      padNumber(month(), 2) +
      "-" +
      padNumber(year(), 4)
    );
  }

  /**
   * Year
   */
  //% block="year"
  //% weight=50 blockGap=8
  export function year(): number {
    return bcdToDec(getRegister(YEAR_REGISTER)) + 2000;
  }

  /**
   * Month
   */
  //% block="month"
  //% weight=50 blockGap=8
  export function month(): number {
    return bcdToDec(getRegister(MONTH_REGISTER) & 0x1f);
  }

  /**
   * Day
   */
  //% block="day"
  //% weight=50 blockGap=8
  export function day(): number {
    return bcdToDec(getRegister(DAY_REGISTER));
  }

  /**
   * Weekday
   */
  //% block="weekday"
  //% weight=50 blockGap=8
  export function weekday(): number {
    return getRegister(WEEKDAY_REGISTER);
  }

  /**
   * temperature
   */
  //% block "temperature"
  //% weight=40
  export function temperature(): number {
    let msb = getRegister(TEMPERATURE_MSB_REGISTER);
    let lsb = getRegister(TEMPERATURE_LSB_REGISTER);
    let sign = msb & 0x80 ? -1.0 : 0.0;
    return (((msb & 0x7f) << 2) + (lsb >> 6)) * 0.25 * sign;
  }
}
