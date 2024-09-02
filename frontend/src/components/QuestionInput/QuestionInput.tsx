import { useRef, useState } from 'react'
import { IconButton, Stack, TextField,Text } from '@fluentui/react'
import { SendRegular } from '@fluentui/react-icons'
import pdfToText  from 'react-pdftotext';  // Import PDF extraction library
import Send from '../../assets/Send.svg'
import styles from './QuestionInput.module.css'
import JSZip from 'jszip';
interface Props {
  onSend: (question: string, id?: string, fileContent?: string| null) => void
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId }: Props) => {
  const [question, setQuestion] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // const sendQuestion = () => {
  //   if (disabled || !question.trim()) {
  //     return
  //   }
  //   if (file) {
  //     onSend(question, conversationId, file);
  //     // const reader = new FileReader();
  //     // reader.onload = () => {
  //     //   const fileContent = reader.result as string; 
  //     //   console.log(fileContent);
  //     //   // This will be a base64 string for binary files or text content
  //     //   // Send both the question and file content to the backend
  //     // };
  //     // reader.readAsText(file);
  //     // console.log(reader.readAsText(file));
  //     //  // Use readAsDataURL if you want to send binary files in base64 format
  //   } else {
  //     // Send only the question if no file is attached
  //     onSend(question, conversationId);
  //   }

  //   if (clearOnSend) {
  //     setQuestion('');
  //     setFile(null); // Clear the file after sending
  //     setFileName(null);
  //   }

  // }
  const sendQuestion = async () => {
    if (disabled || !question.trim()) {
      return;
    }

    let fileContent = '';

    if (file) {
      // If the file is a PDF
      if (file.type === 'application/pdf') {
        try {
          fileContent = await pdfToText(file); // Extracted text from PDF using pdftotext
          console.log('Extracted PDF content:', fileContent);
          onSend(question, conversationId, fileContent);
        } catch (error) {
          console.error('Error extracting PDF content:', error);
        }
      } 
      else if (file.name.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          const docXml = await zip.file('word/document.xml')?.async('text');
          
          if (docXml) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, 'application/xml');
            const paragraphs = xmlDoc.getElementsByTagName('w:t');
            const extractedText = Array.from(paragraphs).map(p => p.textContent).join(' ');
            fileContent = extractedText;
            console.log('Extracted DOCX content:', fileContent);
            onSend(question, conversationId, fileContent);
          } else {
            console.error('Error: Unable to find document.xml in DOCX file.');
          }
        } catch (error) {
          console.error('Error extracting DOCX content:', error);
        }
      }
      // Handle other file types (e.g., DOCX) here
      else {
        const reader = new FileReader();
        reader.onload = () => {
          fileContent = reader.result as string;
          console.log('Extracted file content:', fileContent);
          onSend(question, conversationId, fileContent);
        };
        reader.readAsText(file);
      }
    } else {
      // Send only the question if no file is attached
      onSend(question, conversationId);
    }

    if (clearOnSend) {
      setQuestion('');
      setFile(null); // Clear the file after sending
      setFileName(null);
    }
  };
  

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
      ev.preventDefault()
      sendQuestion()
    }
  }

  const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setQuestion(newValue || '')
  }
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name); // Store the file name
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const sendQuestionDisabled = disabled || !question.trim()

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder}
        multiline
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
      />  
      <input
        type="file"
        id="fileUpload"
        name="file"
        onChange={onFileChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <IconButton
        iconProps={{ iconName: 'Attach' }}
        title="Attach File"
        ariaLabel="Attach File"
        onClick={triggerFileSelect}
      />
      {fileName && (
        <Text variant="small" className={styles.fileName}>
          {fileName}
        </Text>
      )}
      <div
        className={styles.questionInputSendButtonContainer}
        role="button"
        tabIndex={0}
        aria-label="Ask question button"
        onClick={sendQuestion}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? sendQuestion() : null)}>
        {sendQuestionDisabled ? (
          <SendRegular className={styles.questionInputSendButtonDisabled} />
        ) : (
          <img src={Send} className={styles.questionInputSendButton} alt="Send Button" />
        )}
      </div>
      <div className={styles.questionInputBottomBorder} />
    </Stack>
  )
}
