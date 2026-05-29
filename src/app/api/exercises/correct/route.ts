import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import openai from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { question, studentAnswer, correctAnswer, subject, gradeLevel } =
      body;

    if (!question || !studentAnswer) {
      return NextResponse.json(
        { error: "Question et réponse de l'élève requises" },
        { status: 400 }
      );
    }

    const prompt = `Corrige la réponse de cet élève de ${gradeLevel ?? "niveau non précisé"} en ${subject ?? "matière non précisée"}.

Question : ${question}
${correctAnswer ? `Réponse attendue : ${correctAnswer}` : ""}
Réponse de l'élève : ${studentAnswer}

Donne :
1. Une note sur 20
2. Les points positifs
3. Les erreurs identifiées
4. La correction détaillée étape par étape
5. Des conseils pour s'améliorer

Réponds en JSON avec le format :
{
  "score": 15,
  "feedback": "...",
  "positives": ["..."],
  "errors": ["..."],
  "correction": "...",
  "tips": ["..."]
}`;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        score: 14,
        feedback:
          "Mode démo - Connectez une clé API OpenAI pour des corrections personnalisées.",
        positives: ["Bonne structure"],
        errors: ["Détails à vérifier"],
        correction: "Correction détaillée disponible avec l'API OpenAI.",
        tips: ["Continuez vos efforts !"],
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un correcteur pédagogique bienveillant pour le programme scolaire ivoirien. Réponds uniquement en JSON valide.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Pas de réponse de l'IA" },
        { status: 500 }
      );
    }

    const correction = JSON.parse(content);
    return NextResponse.json(correction);
  } catch (error) {
    console.error("Correction error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la correction" },
      { status: 500 }
    );
  }
}
