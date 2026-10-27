
document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contact-form");

    // Replace this with the business WhatsApp number.
    // Sri Lankan number format: 94 followed by the number without the first 0.
    const businessWhatsApp = "94742446828";

    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("customer-name").value.trim();
        const email = document.getElementById("customer-email").value.trim();
        const phone = document.getElementById("customer-phone").value.trim();
        const subject = document.getElementById("message-subject").value;
        const message = document.getElementById("customer-message").value.trim();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        if (businessWhatsApp.includes("X")) {
            alert("Please add the business WhatsApp number in contact.js first.");
            return;
        }

        const whatsappMessage =
            "Sugar Spark Cakes - Contact Message\n\n" +
            "Name: " + name + "\n" +
            "Email: " + email + "\n" +
            "Contact Number: " + phone + "\n" +
            "Subject: " + subject + "\n\n" +
            "Message:\n" + message;

        const whatsappURL =
            "https://wa.me/" + businessWhatsApp +
            "?text=" + encodeURIComponent(whatsappMessage);

        window.open(whatsappURL, "_blank", "noopener,noreferrer");
    });
});
