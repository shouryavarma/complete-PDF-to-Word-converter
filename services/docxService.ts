import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { DocStructure, DocElementType } from "../types";

export const generateDocxBlob = async (structure: DocStructure): Promise<Blob> => {
  const children = structure.elements.map((el) => {
    switch (el.type) {
      case DocElementType.HEADING_1:
        return new Paragraph({
          text: el.content,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200, before: 200 },
        });
      case DocElementType.HEADING_2:
        return new Paragraph({
          text: el.content,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 150, before: 150 },
        });
      case DocElementType.HEADING_3:
        return new Paragraph({
          text: el.content,
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 120, before: 120 },
        });
      case DocElementType.BULLET:
        return new Paragraph({
          text: el.content,
          bullet: { level: 0 },
        });
      case DocElementType.CODE:
        return new Paragraph({
          children: [
            new TextRun({
              text: el.content,
              font: "Courier New",
            })
          ],
          spacing: { after: 100 },
        });
      case DocElementType.PARAGRAPH:
      default:
        return new Paragraph({
          children: [new TextRun(el.content)],
          spacing: { after: 120 },
        });
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};
