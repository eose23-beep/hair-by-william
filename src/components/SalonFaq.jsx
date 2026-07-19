const FAQ_ITEMS = [
  {
    question: "Where is Hair by William located?",
    answer:
      "Hair by William is inside LV Hair Salon at 5411 N. Mesa, Suite 13C, El Paso, TX 79912. Look for Suite 13C when you arrive.",
  },
  {
    question: "What are Hair by William's hours?",
    answer:
      "Open Friday and Saturday 10:00 AM-6:00 PM. Closed Sunday through Thursday. We confirm the next available Friday or Saturday when you book — no online waitlist gimmicks.",
  },
  {
    question: "How do I book an appointment with Hair by William?",
    answer:
      "Call or text 915-920-7823, message on WhatsApp, or use the booking form on this website. WhatsApp and text are the fastest. No online account is required.",
  },
  {
    question: "What services does Hair by William offer?",
    answer:
      "Custom hair extensions (I-Tip, Genius Weft, Tape-In, Micro-link), Brazilian Blowouts, dimensional color and color correction, and precision cuts.",
  },
  {
    question: "What is Hair by William's phone number?",
    answer: "915-920-7823 (+1-915-920-7823).",
  },
];

export default function SalonFaq() {
  return (
    <section id="faq" className="shell section salon-faq" aria-labelledby="salon-faq-heading">
      <div className="salon-faq__inner motion-block">
        <p className="kicker">Visit basics</p>
        <h2 id="salon-faq-heading" className="section-heading">
          Frequently asked questions
        </h2>
        <p className="lead salon-faq__lead">
          Location, hours, booking, and services for Hair by William at LV Hair Salon in El Paso.
        </p>
        <div className="salon-faq__list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="salon-faq__item">
              <summary className="salon-faq__question">{item.question}</summary>
              <p className="salon-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
