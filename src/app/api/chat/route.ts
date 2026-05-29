import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import openai, { buildSystemPrompt } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId et message sont requis" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    // Search for relevant lesson content (simple RAG)
    let lessonContext: string | null = null;
    if (conversation.subject) {
      const lessons = await prisma.lesson.findMany({
        where: {
          subject: { name: conversation.subject },
          ...(conversation.gradeLevel
            ? { gradeLevel: conversation.gradeLevel }
            : {}),
        },
        take: 3,
        select: { title: true, content: true, summary: true },
      });

      if (lessons.length > 0) {
        lessonContext = lessons
          .map((l) => `## ${l.title}\n${l.summary ?? l.content}`)
          .join("\n\n");
      }
    }

    // Save user message
    await prisma.message.create({
      data: {
        content: message,
        role: "user",
        conversationId,
      },
    });

    // Build messages for OpenAI
    const systemPrompt = buildSystemPrompt(
      conversation.gradeLevel,
      conversation.subject,
      conversation.mode,
      lessonContext
    );

    const chatMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback demo response when no API key
      const demoResponse = generateDemoResponse(message, conversation.mode, conversation.subject);
      const savedMessage = await prisma.message.create({
        data: {
          content: demoResponse,
          role: "assistant",
          conversationId,
        },
      });

      // Update conversation title if first message
      if (conversation.messages.length === 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: message.substring(0, 50) },
        });
      }

      return NextResponse.json({ message: savedMessage });
    }

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    let fullResponse = "";
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save assistant message
          const savedMessage = await prisma.message.create({
            data: {
              content: fullResponse,
              role: "assistant",
              conversationId,
            },
          });

          // Update conversation title if first message
          if (conversation.messages.length === 0) {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { title: message.substring(0, 50) },
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, messageId: savedMessage.id })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse" },
      { status: 500 }
    );
  }
}

function generateDemoResponse(
  message: string,
  mode: string,
  subject: string | null
): string {
  const subjectText = subject ? ` en ${subject}` : "";

  if (mode === "EXERCISE") {
    return `## Exercice${subjectText}\n\nVoici un exercice basé sur ta demande : "${message}"\n\n**Question 1 :** Résous le problème suivant en montrant toutes les étapes.\n\n**Question 2 :** Explique la méthode utilisée.\n\n---\n\n*💡 Mode démo : Connectez une clé API OpenAI pour des exercices personnalisés et adaptés au programme ivoirien.*`;
  }

  if (mode === "QUIZ") {
    return `## Quiz${subjectText}\n\n**Question :** Quelle est la bonne réponse ?\n\nA) Option A\nB) Option B\nC) Option C\nD) Option D\n\n---\n\n*💡 Mode démo : Connectez une clé API OpenAI pour des quiz interactifs basés sur le programme ivoirien.*`;
  }

  if (mode === "CORRECTION") {
    return `## Correction${subjectText}\n\nMerci d'avoir soumis ton travail ! Voici une analyse :\n\n✅ **Points forts** : Bonne structure et raisonnement\n⚠️ **À améliorer** : Détailler davantage les étapes\n\n**Note : 14/20**\n\n---\n\n*💡 Mode démo : Connectez une clé API OpenAI pour des corrections détaillées et personnalisées.*`;
  }

  return `## Réponse${subjectText}\n\nMerci pour ta question : "${message}"\n\nJe suis **Ivoir'Académie**, ton assistant éducatif intelligent pour le programme scolaire ivoirien ! 🇨🇮\n\nJe peux t'aider à :\n- 📚 Comprendre tes leçons\n- ✏️ Faire des exercices\n- 📝 Corriger tes devoirs\n- 🧠 Réviser efficacement\n\n---\n\n*💡 Mode démo : Connectez une clé API OpenAI dans les variables d'environnement pour activer l'IA complète.*`;
}
