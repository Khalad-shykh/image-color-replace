import { Link } from 'react-router';
import ArticleLayout from '../components/layout/ArticleLayout.jsx';
import { SITE } from '../config/site.js';
import { ADS } from '../config/ads.js';

export default function PrivacyPage() {
  return (
    <ArticleLayout
      title="Privacy Policy"
      intro={`This policy explains what information ${SITE.name} (“we”, “us”, “the website”) does and does not collect, and the choices you have.`}
      updated={SITE.lastUpdated}
      related={[
        ['/terms-of-service', 'Terms of service'],
        ['/contact', 'Contact us'],
      ]}
    >
      <h2>Summary</h2>
      <ul>
        <li>
          <strong>Your images never leave your device.</strong> They are opened and edited inside your web browser and are not
          uploaded to us or to anyone else.
        </li>
        <li>We do not ask you to create an account and do not collect your name, email address or other personal details.</li>
        <li>The website itself does not set cookies or store your images in your browser.</li>
        {ADS.enabled ? (
          <li>
            We show advertising provided by Google AdSense, which may use cookies as described in the{' '}
            <a href="#advertising">advertising section</a>.
          </li>
        ) : (
          <li>The website does not currently show advertising or use analytics services.</li>
        )}
      </ul>

      <h2>Images you edit</h2>
      <p>
        When you choose, drop or paste an image, your browser reads the file and the tool processes its pixels locally using the
        HTML Canvas API and a Web Worker running on your device. The image data is not transmitted over the network, is not
        stored on any server, and is not shared with advertising or analytics providers. It is held only in your browser’s memory
        while the page is open and is discarded when you close the image, reload the page or leave the website. When you
        download a result, the file is created on your device.
      </p>

      <h2>Information collected automatically</h2>
      <p>
        Like every website, this site is delivered by a hosting provider. To deliver pages and protect the service against abuse,
        the hosting provider’s servers process technical information that your browser sends with each request, such as your IP
        address, browser type, the page requested and the time of the request. This information may be kept in short-term
        server logs by the hosting provider under its own privacy policy. We do not use it to identify you.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        The website’s own code does not set cookies and does not save data in your browser’s local storage.
        {ADS.enabled ? ' Third-party advertising cookies are described below.' : ''}
      </p>

      {ADS.enabled ? (
        <section aria-labelledby="advertising">
          <h2 id="advertising">Advertising</h2>
          <p>
            We use Google AdSense to show ads on some pages. Ads are never placed inside the image editor, and your images are
            never shared with advertisers.
          </p>
          <ul>
            <li>
              Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other
              websites.
            </li>
            <li>
              Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site
              and/or other sites on the Internet.
            </li>
            <li>
              You may opt out of personalized advertising by visiting{' '}
              <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
                Google Ads Settings
              </a>
              . You can also learn how to opt out of some third-party vendors’ use of cookies for personalized advertising at{' '}
              <a href="https://www.aboutads.info/choices/" rel="noopener noreferrer" target="_blank">
                aboutads.info
              </a>
              .
            </li>
            <li>
              Learn more about{' '}
              <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" target="_blank">
                how Google uses information from sites that use its services
              </a>
              .
            </li>
          </ul>
          <p>
            If you are in the European Economic Area, the United Kingdom or Switzerland, you will be asked for your consent
            through a consent message before personalized ads or advertising cookies are used, and you can change your choice at
            any time. Where consent is not given, Google may show non-personalized or limited ads.
          </p>
        </section>
      ) : (
        <>
          <h2>Advertising</h2>
          <p>
            The website does not currently display advertising. If we add advertising in the future, we will update this policy
            before it starts, describe the providers and cookies involved, and ask for consent where the law requires it.
          </p>
        </>
      )}

      <h2>Emails you send us</h2>
      <p>
        If you contact us by email, we receive your email address and the content of your message. We use them only to reply
        and to improve the website, and we do not sell or share them. Please do not send images that contain personal
        information.
      </p>

      <h2>Children</h2>
      <p>
        The website is a general-audience tool and is not directed at children under 13. We do not knowingly collect personal
        information from children.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live (for example under the GDPR in the EU/UK or privacy laws in US states such as California),
        you may have the right to access, correct or delete personal information about you, and to object to certain
        processing. Because we do not collect personal information through the tool, there is usually nothing for us to provide
        or delete; for emails you have sent us, contact us and we will help. We do not sell personal information.
      </p>

      <h2>Security</h2>
      <p>
        The website is served over HTTPS. Uploaded files are checked before they are opened and are processed only as image data
        — they are never executed. Because images stay on your device, their security also depends on your device and browser.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy when the website changes. The “last updated” date at the top shows when it was last revised.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent through the <Link to="/contact">contact page</Link>.
      </p>
    </ArticleLayout>
  );
}
