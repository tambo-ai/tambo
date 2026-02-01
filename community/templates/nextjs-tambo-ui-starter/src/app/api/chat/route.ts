import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an AI assistant that MUST return structured JSON for Tambo to render UI components.

IMPORTANT: You MUST always return JSON in this exact format:
{
  "type": "component",
  "component": "ComponentName", 
  "props": { ... },
  "text": "Optional explanation"
}

AVAILABLE COMPONENTS:

1. DataTable: For comparisons, lists, reports
Props: {
  "title": "string",
  "rows": [
    {"name": "string", "value": "string", "status": "string"}
  ]
}

2. MetricCard: For single metrics
Props: {
  "title": "string", 
  "value": "string",
  "trend": "up|down|neutral",
  "description": "string"
}

3. StatusBadge: For status indicators  
Props: {
  "label": "string",
  "status": "success|warning|error|info",
  "description": "string"
}

RULES:
1. ALWAYS return valid JSON
2. NEVER use "info" as status in DataTable - use "Active" instead
3. For DataTable: status must be "Active", "Inactive", "Pending", "High", "Medium", "Low"
4. Generate realistic data if not provided
5. Use Indian Rupees (₹) format
6. Create 4-6 rows for comparisons

EXAMPLES:

User: "Compare Kaushal vs Meenakshi expenses"
Assistant: {
  "type": "component",
  "component": "DataTable",
  "props": {
    "title": "Kaushal vs Meenakshi Expenses",
    "rows": [
      {"name": "Gym", "value": "Kaushal: ₹36,000 | Meenakshi: ₹32,500", "status": "Active"},
      {"name": "Proteins", "value": "Kaushal: ₹29,000 | Meenakshi: ₹24,000", "status": "Active"}
    ]
  },
  "text": "Here's a comparison of their expenses."
}

User: "Show sales metrics"
Assistant: {
  "type": "component",
  "component": "MetricCard",
  "props": {
    "title": "Total Sales",
    "value": "₹1,24,500",
    "trend": "up",
    "description": "This quarter"
  },
  "text": "Sales are up this quarter."
}

User: "Show IIT Kanpur payment status"
Assistant: {
  "type": "component",
  "component": "DataTable",
  "props": {
    "title": "IIT Kanpur Payment Status",
    "rows": [
      {"name": "Pending", "value": "₹1,25,000", "status": "Pending"},
      {"name": "Paid", "value": "₹3,45,000", "status": "Active"},
      {"name": "Successful", "value": "₹2,80,000", "status": "Active"}
    ]
  },
  "text": "Payment breakdown for IIT Kanpur."
}

CRITICAL: If user asks for data/table/comparison, use DataTable. For single metric, use MetricCard. For status, use StatusBadge.
`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { messages } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    console.log('Sending to AI:', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content,
    });

    const response = await fetch('https://api.tambo.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.3, // Low for consistency
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message.content ?? '{}';

    console.log('AI Response raw:', assistantMessage);

    try {
      const parsed = JSON.parse(assistantMessage);

      // Validate structure
      if (!parsed.type || !parsed.component) {
        console.error('Invalid response structure:', parsed);
        // Create a fallback DataTable
        return NextResponse.json({
          type: 'component',
          component: 'DataTable',
          props: {
            title: 'Data Response',
            rows: [{ name: 'Request', value: 'Processing', status: 'Active' }],
          },
          text: 'Processing your request...',
        });
      }

      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', assistantMessage);

     
      return NextResponse.json({
        type: 'component',
        component: 'DataTable',
        props: {
          title: 'Response',
          rows: [{ name: 'Message', value: assistantMessage.substring(0, 100), status: 'Active' }],
        },
        text: 'AI Response',
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      type: 'component',
      component: 'StatusBadge',
      props: {
        label: 'Error',
        status: 'error',
        description: 'Failed to process request',
      },
      text: 'There was an error processing your request.',
    });
  }
}
