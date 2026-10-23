
/* Sugar Spark Cakes - Home Page JavaScript */

document.addEventListener("DOMContentLoaded", function () {

    // Smooth scrolling for links pointing to sections on this page
    const sectionLinks = document.querySelectorAll('a[href^="#"]');

    sectionLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                event.preventDefault();

                targetSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    console.log("Home page JavaScript loaded successfully.");
});
