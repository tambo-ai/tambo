package co.tambo.sdk.compose.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import co.tambo.sdk.Message
import co.tambo.sdk.MessageContent
import co.tambo.sdk.MessageRole

@Composable
fun MessageBubble(
    message: Message,
    modifier: Modifier = Modifier
) {
    val isUser = message.role == MessageRole.USER
    
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isUser) 16.dp else 4.dp,
                bottomEnd = if (isUser) 4.dp else 16.dp
            ),
            color = if (isUser) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            },
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Column(
                modifier = Modifier.padding(12.dp)
            ) {
                when (val content = message.content) {
                    is MessageContent.Text -> {
                        Text(
                            text = content.text,
                            color = if (isUser) {
                                MaterialTheme.colorScheme.onPrimary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            }
                        )
                    }
                    is MessageContent.Component -> {
                        Text(
                            text = "[Component: ${content.componentName}]",
                            color = if (isUser) {
                                MaterialTheme.colorScheme.onPrimary
                            } else {
                                MaterialTheme.colorScheme.onSurfaceVariant
                            },
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    is MessageContent.Mixed -> {
                        content.parts.forEach { part ->
                            when (part) {
                                is MessageContent.Text -> {
                                    Text(
                                        text = part.text,
                                        color = if (isUser) {
                                            MaterialTheme.colorScheme.onPrimary
                                        } else {
                                            MaterialTheme.colorScheme.onSurfaceVariant
                                        }
                                    )
                                }
                                else -> {}
                            }
                        }
                    }
                }
            }
        }
    }
}
