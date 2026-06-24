import { BookOpenText, Mail, MapPin, Phone } from "lucide-react";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";

export default function AboutPage({ siteConfig = DEFAULT_SITE_CONFIG }) {
  const config = normalizeSiteConfig(siteConfig);
  const about = config.aboutPage;
  const contact = config.contact;

  return (
    <section className="directory-page about-page">
      <div className="directory-hero about-hero">
        <div>
          <span className="directory-kicker">
            <BookOpenText strokeWidth={1.8} />
            {config.familyName}
          </span>
          <h1>{about.title}</h1>
          <p>{about.subtitle}</p>
        </div>
        {about.imageUrl && (
          <div className="about-hero-image">
            <img src={about.imageUrl} alt="" />
          </div>
        )}
      </div>

      <div className="about-content-grid">
        <article className="about-content-panel glass">
          <h2>Tổng quan</h2>
          <p>{about.description}</p>
        </article>

        {about.origin && (
          <article className="about-content-panel glass">
            <h2>Quê gốc và thủy tổ</h2>
            <p>{about.origin}</p>
          </article>
        )}

        {about.tradition && (
          <article className="about-content-panel glass">
            <h2>Truyền thống</h2>
            <p>{about.tradition}</p>
          </article>
        )}

        {about.representativeText && (
          <article className="about-content-panel glass">
            <h2>Dấu ấn dòng họ</h2>
            <p>{about.representativeText}</p>
          </article>
        )}

        {about.showContact && (contact.managerName || contact.phone || contact.email || contact.address) && (
          <article className="about-content-panel about-contact-panel glass">
            <h2>Liên hệ</h2>
            {contact.managerName && <p><strong>{contact.managerName}</strong></p>}
            {contact.phone && <p><Phone size={15} strokeWidth={2} /> {contact.phone}</p>}
            {contact.email && <p><Mail size={15} strokeWidth={2} /> {contact.email}</p>}
            {contact.address && <p><MapPin size={15} strokeWidth={2} /> {contact.address}</p>}
          </article>
        )}
      </div>
    </section>
  );
}
