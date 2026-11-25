import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ExportCompany } from "@/lib/export/types";

export const letterheadStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: "#C9D2DC",
  },
  logo: { width: 54, height: 54, objectFit: "contain", marginRight: 10 },
  company: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  contact: { fontSize: 8, color: "#56697F", lineHeight: 1.35 },
});

export function CompanyLetterhead({ company }: { company: ExportCompany }) {
  const contact = [
    company.companyAddress,
    company.companyPhone,
    company.companyEmail,
    company.companyWebsite,
  ]
    .filter(Boolean)
    .join(" · ");
  const registrations = [
    company.companyRcNumber && `RC ${company.companyRcNumber}`,
    company.companyTin && `TIN ${company.companyTin}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={letterheadStyles.wrapper}>
      {company.companyLogoDataUrl && (
        // react-pdf images are rendered into the document rather than the DOM.
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={company.companyLogoDataUrl} style={letterheadStyles.logo} />
      )}
      <View>
        <Text style={letterheadStyles.company}>{company.companyName}</Text>
        {contact && <Text style={letterheadStyles.contact}>{contact}</Text>}
        {registrations && <Text style={letterheadStyles.contact}>{registrations}</Text>}
      </View>
    </View>
  );
}

