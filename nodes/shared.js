// @ts-check

exports.getCurrentTimeAndDate = () => {
  // Get the current date and time
  const now = new Date();

  // Format the time and date separately, using the user's local time zone
  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = now.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Combine the formatted time and date in the desired order
  const formattedDateTime = `${formattedDate} - ${formattedTime}`;

  return formattedDateTime;
};
