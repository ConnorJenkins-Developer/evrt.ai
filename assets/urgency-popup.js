// assets/urgency-popup.js
(function () {
  // Only execute on mobile devices
  if (window.innerWidth > 980) return;

  // Function to hide the pop-up
  function hidePopUp() {
    const popUp = document.querySelector('.pop-up, .slot-popup, .popup-slots'); // Adjust this if necessary
    if (!popUp) return;

    const closeButton = document.createElement('button');
    closeButton.innerText = '×'; // Close button text
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'transparent';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    
    // Append close button
    popUp.appendChild(closeButton);

    closeButton.addEventListener('click', function() {
      popUp.style.display = 'none';
      localStorage.setItem('popupDismissed', 'true'); // Store dismissal state
    });

    // If popup is already dismissed in the session
    if (localStorage.getItem('popupDismissed') === 'true') {
      popUp.style.display = 'none';
    }
  }

  // Wait for the page to load
  window.addEventListener('load', function() {
    hidePopUp();
  });
})();
