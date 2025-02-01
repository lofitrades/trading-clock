let hoveredKillzone = null; // Track the currently hovered killzone
let selectedTimezone = localStorage.getItem("selectedTimezone") || "America/New_York"; // Default to NY Time

document.addEventListener("DOMContentLoaded", () => {
  const defaultKillzones = [
    { name: "NY AM", startNY: "07:00", endNY: "11:00", color: "#A8D8B9" },
    { name: "NY PM", startNY: "13:30", endNY: "16:00", color: "#A7C7E7" },
    { name: "Market Closed", startNY: "17:00", endNY: "18:00", color: "#F7C2A3" },
    { name: "Asia", startNY: "20:00", endNY: "00:00", color: "#F8C8D1" },
    { name: "London", startNY: "02:00", endNY: "05:00", color: "#D1B2E1" },
    { name: "", startNY: "", endNY: "", color: "#F9E89D" },
    { name: "", startNY: "", endNY: "", color: "#F6A1A1" },
    { name: "", startNY: "", endNY: "", color: "#D3D3D3" },
  ];

  let killzones = JSON.parse(localStorage.getItem("killzones")) || [...defaultKillzones];

  // Get all available timezones
  const timezones = Intl.supportedValuesOf('timeZone');

  // Initialize timezone dropdown
  const timezoneDropdown = document.getElementById("timezoneDropdown");

  // Create an array of timezone objects with their offsets
  const timezoneData = timezones.map(timezone => {
    const offset = getUTCOffset(timezone);
    return { timezone, offset };
  });

  // Sort timezones by UTC offset
  timezoneData.sort((a, b) => {
    const offsetA = parseOffset(a.offset);
    const offsetB = parseOffset(b.offset);
    return offsetA - offsetB;
  });

  // Populate the dropdown with sorted timezones
  timezoneData.forEach(({ timezone, offset }) => {
    const option = document.createElement("option");
    option.value = timezone;
    option.textContent = `(UTC${offset}) ${timezone}`;
    timezoneDropdown.appendChild(option);
  });

  // Set the selected timezone
  timezoneDropdown.value = selectedTimezone;

  // Update timezone when dropdown changes
  timezoneDropdown.addEventListener("change", (event) => {
    selectedTimezone = event.target.value;
    localStorage.setItem("selectedTimezone", selectedTimezone);
    drawClock();
  });

  function getUTCOffset(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find(part => part.type === 'timeZoneName').value;
    return offset.replace(/UTC|GMT/, '').trim(); // Extract offset (e.g., "-05:00")
  }

  function parseOffset(offset) {
    // Convert offset string (e.g., "-05:00") to minutes
    const [hours, minutes] = offset.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  function init() {
    createKillzoneInputs();
    drawClock();
  }

  function init() {
    createKillzoneInputs();
    drawClock();
  }
  function createKillzoneInputs() {
    const container = document.getElementById("killzoneInputs");
    container.innerHTML = "";
  
    // Add headers for Name, Start Time, and End Time
    const headers = document.createElement("div");
    headers.classList.add("killzone-headers");
    headers.innerHTML = `
      <span style="width: 80px; text-align: center;">Name</span>
      <span style="width: 80px; text-align: center;">Start Time</span>
      <span style="width: 80px; text-align: center;">End Time</span>
      <span style="width: 30px; text-align: center;">Color</span>
    `;
    container.appendChild(headers);
  
    
    // Add inputs for each killzone
    killzones.forEach((kz, index) => {
      const div = document.createElement("div");
      div.classList.add("killzone-input");
      div.innerHTML = `
        <input type="text" value="${kz.name}" id="name-${index}" style="width: 80px;">
        <input type="time" value="${kz.startNY}" id="start-${index}" style="width: 80px;">
        <input type="time" value="${kz.endNY}" id="end-${index}" style="width: 80px;">
        <input type="color" value="${kz.color}" id="color-${index}"style="width: 30px;">
      `;
      container.appendChild(div);
  
      // Add event listeners to save changes
      ["input", "change"].forEach((event) => {
        document.getElementById(`name-${index}`).addEventListener(event, saveKillzones);
        document.getElementById(`start-${index}`).addEventListener(event, saveKillzones);
        document.getElementById(`end-${index}`).addEventListener(event, saveKillzones);
        document.getElementById(`color-${index}`).addEventListener(event, saveKillzones);
      });
    });
  }

  function saveKillzones() {
    killzones = killzones.map((_, index) => ({
      name: document.getElementById(`name-${index}`).value,
      startNY: document.getElementById(`start-${index}`).value,
      endNY: document.getElementById(`end-${index}`).value,
      color: document.getElementById(`color-${index}`).value,
    }));

    localStorage.setItem("killzones", JSON.stringify(killzones));
    drawClock();
  }

  function drawClock() {
    const canvas = document.getElementById("clockCanvas");
    const ctx = canvas.getContext("2d");
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: selectedTimezone }));
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 5;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    drawKillzoneDonut(ctx, centerX, centerY, radius, killzones);
    drawClockNumbers(ctx, centerX, centerY, radius);

    const hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();

    // Calculate the hour angle based on both hours and minutes
    const hourAngle = ((hours % 12) * 30 + minutes * 0.5) * Math.PI / 180; // Adjust for minutes

    // Apply condition to set hour hand length based on AM/PM
    const hourHandLength = hours >= 12 ? radius * 0.74 : radius * 0.5;
    drawHand(ctx, centerX, centerY, hourAngle, hourHandLength, 6, "round", "#4B4B4B"); // hour hand
    drawHand(ctx, centerX, centerY, (minutes * 6) * (Math.PI / 180), radius * 0.9, 3, "round", "#4B4B4B"); // minute hand
    drawHand(ctx, centerX, centerY, (seconds * 6) * (Math.PI / 180), radius * 1, 1, "round", "#4B4B4B"); // second hand

    updateDigitalClock(localTime);
    updateKillzoneLabel(localTime);
    setTimeout(drawClock, 1000); // Redraw the clock every second
  }

  function drawHand(ctx, x, y, angle, length, width, lineCap = "butt", color = "black") {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle - Math.PI / 2) * length, y + Math.sin(angle - Math.PI / 2) * length);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = lineCap;  // Set lineCap for hands
    ctx.stroke();
  }

  function getLineWidthAndHoverArea(size) {
    switch (size) {
      case 300: // Aesthetic
        return { lineWidth: 80, hoverLineWidth: 87 };
      case 150: // Small
        return { lineWidth: 12, hoverLineWidth: 14 };
      case 250: // Tiny
        return { lineWidth: 18, hoverLineWidth: 21 };
      case 375: // Normal
        return { lineWidth: 30, hoverLineWidth: 34 };
      case 600: // Big
        return { lineWidth: 60, hoverLineWidth: 65 };
      case 1200: // Huge
        return { lineWidth: 100, hoverLineWidth: 120 };
      default:
        return { lineWidth: 30, hoverLineWidth: 34 }; // Default to Normal
    }
  }
  
  function drawKillzoneDonut(ctx, x, y, radius, killzones) {
    const totalTime = 12 * 60;
    const amRadius = radius * 0.52;
    const pmRadius = radius * 0.75;
  
    // Get the current clock size from the dropdown
    const clockSize = parseInt(document.getElementById("clockSize").value);
    const { lineWidth, hoverLineWidth } = getLineWidthAndHoverArea(clockSize);
  
    killzones.forEach((kz) => {
      const [startHour, startMinute] = kz.startNY.split(":").map(Number);
      const [endHour, endMinute] = kz.endNY.split(":").map(Number);
  
      let angleStart = ((startHour % 12) * 60 + startMinute) / totalTime * Math.PI * 2;
      let angleEnd = ((endHour % 12) * 60 + endMinute) / totalTime * Math.PI * 2;
  
      if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
        angleEnd += Math.PI * 2;
      }
  
      const targetRadius = startHour < 12 ? amRadius : pmRadius;
  
      // Use dynamic lineWidth values
      const currentLineWidth = kz === hoveredKillzone ? hoverLineWidth : lineWidth;
  
      ctx.beginPath();
      ctx.arc(x, y, targetRadius, angleStart - Math.PI / 2, angleEnd - Math.PI / 2);
      ctx.lineWidth = currentLineWidth;
      ctx.lineCap = "butt";
      ctx.strokeStyle = kz.color;
      ctx.stroke();
    });
  }

  function drawClockNumbers(ctx, x, y, radius) {
    ctx.font = `${radius * 0.075}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#303030";

    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const numberX = x + Math.cos(angle - Math.PI / 2) * (radius * 0.3);
      const numberY = y + Math.sin(angle - Math.PI / 2) * (radius * 0.3);
      ctx.fillText(i, numberX, numberY);
    }
  }

  function updateDigitalClock(localTime) {
    let hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const seconds = localTime.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM"; // Determine AM or PM

    // Convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)

    // Format the time as HH:MM:SS AM/PM
    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${ampm}`;

    // Update the digital clock display
    document.getElementById("digitalClock").textContent = formattedTime;
  }

  function updateKillzoneLabel(localTime) {
    const currentTimeInMinutes = localTime.getHours() * 60 + localTime.getMinutes();
    let activeKillzone = null;

    killzones.forEach(kz => {
      const [startHour, startMinute] = kz.startNY.split(":").map(Number);
      const [endHour, endMinute] = kz.endNY.split(":").map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      // Check if current time falls within the killzone range
      if (
        (start <= end && currentTimeInMinutes >= start && currentTimeInMinutes < end) ||  
        (start > end && (currentTimeInMinutes >= start || currentTimeInMinutes < end))
      ) {
        activeKillzone = kz;
      }
    });

    // Update label
    const label = document.getElementById("killzoneLabel");
    if (label) {
      if (activeKillzone) {
        label.textContent = `Active Killzone: ${activeKillzone.name}`;
        label.style.backgroundColor = activeKillzone.color;

        // Use the isColorDark function to determine text color
        const isDark = isColorDark(activeKillzone.color);
        label.style.color = isDark ? "#ffffff" : "#4B4B4B"; // White text for dark colors, black for light
      } else {
        label.textContent = "No Active Killzone";
        label.style.backgroundColor = "#ffffff";
        label.style.color = "#4B4B4B"; // Default to black text
      }
    }
  }

  // Add tooltip element reference
  const tooltip = document.getElementById("tooltip");

  // Add mouse move event listener to the canvas
  const canvas = document.getElementById("clockCanvas");
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleMouseLeave);

  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Get the hovered killzone
    const newHoveredKillzone = getHoveredKillzone(mouseX, mouseY);

    // Update the tooltip and hovered killzone
    if (newHoveredKillzone) {
      // Update tooltip content
      tooltip.innerHTML = `
        <strong>${newHoveredKillzone.name}</strong><br>
        Start: ${newHoveredKillzone.startNY}<br>
        End: ${newHoveredKillzone.endNY}
      `;

      // Set tooltip background color to the hovered killzone's color
      tooltip.style.backgroundColor = newHoveredKillzone.color;

      // Ensure text is readable (white text for dark backgrounds, black text for light backgrounds)
      const isDarkColor = isColorDark(newHoveredKillzone.color);
      tooltip.style.color = isDarkColor ? "#ffffff" : "#000000";

      // Position tooltip near the cursor
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none";
    }

    // Update the hovered killzone and redraw the clock
    if (hoveredKillzone !== newHoveredKillzone) {
      hoveredKillzone = newHoveredKillzone;
      drawClock(); // Redraw the clock to reflect the updated hover state
    }
  }

  function handleMouseLeave() {
    tooltip.style.display = "none";
  }

  function isColorDark(color) {
    // Remove the '#' from the hex color if present
    const hex = color.replace("#", "");

    // Convert the hex color to RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if the color is dark
    return luminance < 0.5;
  }

  function getHoveredKillzone(mouseX, mouseY) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 5;
  
    // Get the current clock size from the dropdown
    const clockSize = parseInt(document.getElementById("clockSize").value);
    const { hoverLineWidth } = getLineWidthAndHoverArea(clockSize);
  
    // Calculate the angle of the mouse position relative to the center
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) + Math.PI / 2; // Adjust for canvas rotation
  
    // Normalize angle to [0, 2π]
    const normalizedAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
  
    // Define AM and PM killzone radii dynamically based on the current canvas size
    const amRadius = radius * 0.52; // Smaller radius for AM killzones
    const pmRadius = radius * 0.75; // Larger radius for PM killzones
  
    // Check if the mouse is within the hover area of AM or PM killzones
    if (distance >= amRadius - hoverLineWidth && distance <= amRadius + hoverLineWidth) {
      // Mouse is in the AM killzone radius
      for (const kz of killzones) {
        const [startHour, startMinute] = kz.startNY.split(":").map(Number);
        const [endHour, endMinute] = kz.endNY.split(":").map(Number);
  
        // Only consider AM killzones (startHour < 12)
        if (startHour < 12) {
          const startAngle = ((startHour % 12) * 60 + startMinute) / (12 * 60) * Math.PI * 2;
          let endAngle = ((endHour % 12) * 60 + endMinute) / (12 * 60) * Math.PI * 2;
  
          if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
            endAngle += Math.PI * 2;
          }
  
          // Check if the normalized angle falls within the AM killzone range
          if (
            (normalizedAngle >= startAngle && normalizedAngle <= endAngle) ||
            (normalizedAngle + 2 * Math.PI >= startAngle && normalizedAngle + 2 * Math.PI <= endAngle)
          ) {
            return kz;
          }
        }
      }
    } else if (distance >= pmRadius - hoverLineWidth && distance <= pmRadius + hoverLineWidth) {
      // Mouse is in the PM killzone radius
      for (const kz of killzones) {
        const [startHour, startMinute] = kz.startNY.split(":").map(Number);
        const [endHour, endMinute] = kz.endNY.split(":").map(Number);
  
        // Only consider PM killzones (startHour >= 12)
        if (startHour >= 12) {
          const startAngle = ((startHour % 12) * 60 + startMinute) / (12 * 60) * Math.PI * 2;
          let endAngle = ((endHour % 12) * 60 + endMinute) / (12 * 60) * Math.PI * 2;
  
          if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
            endAngle += Math.PI * 2;
          }
  
          // Check if the normalized angle falls within the PM killzone range
          if (
            (normalizedAngle >= startAngle && normalizedAngle <= endAngle) ||
            (normalizedAngle + 2 * Math.PI >= startAngle && normalizedAngle + 2 * Math.PI <= endAngle)
          ) {
            return kz;
          }
        }
      }
    }
  
    return null; // No killzone hovered
  }

  init();
});