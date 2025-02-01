document.addEventListener("DOMContentLoaded", () => {
    // Get sidebar elements
    const sidebar = document.getElementById("sidebarMenu");
    const settingsButton = document.getElementById("settingsButton");
    const closeSidebar = document.getElementById("closeSidebar");
  
    // Open sidebar when settings button is clicked
    settingsButton.addEventListener("click", () => {
      sidebar.style.width = "400px"; // Increased sidebar width to 400px
    });
  
    // Close sidebar when "X" is clicked
    closeSidebar.addEventListener("click", () => {
      sidebar.style.width = "0";
    });
  
    // Close sidebar when clicking outside the sidebar content
    window.addEventListener("click", (event) => {
      if (event.target === sidebar) {
        sidebar.style.width = "0";
      }
    });
  
    // Clock Size Dropdown
    const clockSizeDropdown = document.getElementById("clockSize");
    const savedSize = localStorage.getItem("clockSize"); // Get saved size from localStorage
  
    // Set the dropdown value to the saved size or default to "375" (Normal)
    if (savedSize) {
      clockSizeDropdown.value = savedSize;
    } else {
      clockSizeDropdown.value = "375"; // Default to Normal
      localStorage.setItem("clockSize", "375"); // Save the default size to localStorage
    }
  
    // Apply the saved size on page load
    resizeSite(parseInt(clockSizeDropdown.value));
  
    // Update size when dropdown changes
    clockSizeDropdown.addEventListener("change", (event) => {
      const size = parseInt(event.target.value);
      localStorage.setItem("clockSize", size); // Save the selected size to localStorage
      resizeSite(size);
    });
  
    function resizeSite(size) {
      // Resize the canvas
      const canvas = document.getElementById("clockCanvas");
      canvas.width = size;
      canvas.height = size;
  
      // Adjust the body's max-width to keep everything centered
      const body = document.body;
      body.style.maxWidth = `${size + 200}px`; // Add some padding
  
      // Ensure the body stays centered
      body.style.margin = "0 auto";
      body.style.display = "flex";
      body.style.flexDirection = "column";
      body.style.alignItems = "center";
    }
  });