import { contact } from "@/data/angeronia";

export function Contact() {
  return (
    <section id="contact" data-screen-label="Contact" className="ang-contact">
      <div className="ang-contact-inner" data-reveal>
        <div className="ang-rule">
          {contact.label}
          <span />
        </div>
        <h2 className="ang-contact-h">{contact.heading}</h2>
        <p className="ang-contact-body">{contact.body}</p>
        <div className="ang-contact-row">
          <a href={contact.cta.href} className="ang-btn ang-btn-fill">
            {contact.cta.label}
          </a>
          <a className="ang-contact-email ang-mlink" href={contact.cta.href}>
            {contact.emailText}
          </a>
        </div>
      </div>
    </section>
  );
}
