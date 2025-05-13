import ssl
import nltk

# Disable SSL verification (only for development)
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download NLTK data
print("Downloading punkt...")
nltk.download('punkt')
print("Downloading stopwords...")
nltk.download('stopwords')

print("NLTK resources downloaded successfully!")