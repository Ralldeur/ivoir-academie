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
    const { subject, gradeLevel, topic, difficulty, type, count } = body;

    if (!subject || !gradeLevel) {
      return NextResponse.json(
        { error: "Matière et niveau requis" },
        { status: 400 }
      );
    }

    const typeInstructions: Record<string, string> = {
      QCM: "Questions à choix multiples avec 4 options (A, B, C, D). Indique la bonne réponse.",
      OPEN: "Questions ouvertes nécessitant une réponse détaillée.",
      TRUE_FALSE: "Questions Vrai/Faux avec justification.",
      FILL_BLANK: "Phrases à compléter avec les mots manquants.",
    };

    const prompt = `Génère ${count ?? 3} exercices de ${subject} pour un élève de ${gradeLevel} en Côte d'Ivoire.
${topic ? `Sujet spécifique : ${topic}` : ""}
Difficulté : ${difficulty ?? "MEDIUM"}
Type : ${typeInstructions[type ?? "OPEN"] ?? typeInstructions.OPEN}

Réponds en JSON avec le format suivant :
{
  "exercises": [
    {
      "question": "...",
      "answer": "...",
      "explanation": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."] // seulement pour QCM
    }
  ]
}`;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        exercises: [
          {
            question: `Exercice de démonstration en ${subject} (${gradeLevel})`,
            answer: "Réponse de démonstration",
            explanation:
              "Connectez une clé API OpenAI pour générer des exercices personnalisés.",
            options: null,
          },
        ],
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un générateur d'exercices pour le programme scolaire ivoirien. Réponds uniquement en JSON valide.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Pas de réponse de l'IA" },
        { status: 500 }
      );
    }

    const exercises = JSON.parse(content);
    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Exercise generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
