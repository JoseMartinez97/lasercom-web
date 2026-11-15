// Name, address and phone, in one place: the footer, the contact page, the
// structured data and the quote builder all read them from here, so they never
// disagree (Google compares them with the Business Profile)
export const business = {
  name: "Lasercom",
  legalName: "Vicente José Codosero García",
  founded: 2007,
  phone: "+34626370506",
  phoneDisplay: "626 37 05 06",
  landline: "+34961849017",
  landlineDisplay: "96 184 90 17",
  whatsapp: "34626370506",
  email: "lasercom@lasercom.es",
  street: "Polígono Industrial El Oliveral, calle L, nave 41",
  postalCode: "46394",
  locality: "Riba-roja de Túria",
  region: "Valencia",
  country: "ES",
  // Pin and listing of the Google Business Profile
  geo: { latitude: 39.4755102, longitude: -0.5303971 },
  mapsUrl: "https://www.google.com/maps?cid=12242357149241341378",
  // As published on the Business Profile
  hours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "09:00",
      closes: "13:30",
    },
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "16:00",
      closes: "18:30",
    },
    { days: ["Friday"], opens: "09:00", closes: "13:30" },
  ],
  rating: { value: 4.5, count: 6 },
  // Towns the workshop serves, for the structured data
  areaServed: [
    "Valencia",
    "Riba-roja de Túria",
    "Paterna",
    "Manises",
    "L'Eliana",
    "Llíria",
    "Quart de Poblet",
    "Aldaia",
    "Mislata",
    "Burjassot",
  ],
} as const

export const telHref = `tel:${business.phone}`
export const mailHref = (subject?: string) =>
  `mailto:${business.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`
export const whatsappHref = (text?: string) =>
  `https://wa.me/${business.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`
