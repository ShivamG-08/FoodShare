// Navbar hamburger toggle (for mobile)
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

// Counter animation for Impact section
const counters = document.querySelectorAll(".counter");
const speed = 200;
counters.forEach(counter => {
  const updateCount = () => {
    const target = +counter.getAttribute("data-target");
    const count = +counter.innerText;
    const increment = target / speed;
    if (count < target) {
      counter.innerText = Math.ceil(count + increment);
      setTimeout(updateCount, 20);
    } else {
      counter.innerText = target;
    }
  };
  updateCount();
});
// Donate Section Interaction
const donateBtn = document.querySelector("#donate .btn-primary");

if (donateBtn) {
  donateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    alert("🙏 Thank you for supporting our mission! Redirecting to donation page...");
    // Example: redirect to a donation/payment page
    // window.location.href = "https://your-donation-link.com";
  });
}