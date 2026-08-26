const fs = require('fs');
const path = require('path');

const editPath = path.join(__dirname, 'app', 'recipe', 'edit', '[id].tsx');
let content = fs.readFileSync(editPath, 'utf8');

// 1. Rename component and add useLocalSearchParams import if not present
content = content.replace('export default function CreateRecipeScreen() {', `import { useLocalSearchParams } from 'expo-router';\n\nexport default function EditRecipeScreen() {`);

// 2. Extract ID
content = content.replace('const router = useRouter();', `const router = useRouter();\n  const { id } = useLocalSearchParams();`);

// 3. Add useEffect to fetch data
const fetchEffect = `
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(\`\${API_BASE_URL}/recipes/\${id}\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        const data = await res.json();
        if (data.success) {
          const r = data.recipe;
          setTitle(r.title || '');
          setDescription(r.description || '');
          setPrepTime(r.prep_time_minutes?.toString() || '');
          setCookTime(r.cook_time_minutes?.toString() || '');
          setServings(r.servings?.toString() || '1');
          setIsPublic(r.status === 'pending' || r.status === 'approved');
          setIngredients(r.ingredients || []);
          setSteps(r.steps || []);
          if (r.image_url) setImageUri(r.image_url);
        }
      } catch(e) {
        Alert.alert('Lỗi', 'Không thể lấy dữ liệu công thức');
      }
    };
    if (id) fetchRecipeData();
  }, [id]);
`;
content = content.replace('const [isSubmitting, setIsSubmitting] = useState(false);', `const [isSubmitting, setIsSubmitting] = useState(false);\n${fetchEffect}`);

// 4. Change Create to Edit UI texts
content = content.replace('Tạo công thức mới', 'Sửa công thức');
content = content.replace('Tạo công thức', 'Lưu thay đổi');
content = content.replace('Đang tạo...', 'Đang lưu...');
content = content.replace('Tạo thành công!', 'Lưu thành công!');
content = content.replace('Đã tạo công thức của bạn.', 'Đã lưu thay đổi.');

// 5. Change POST to PUT and URL
content = content.replace(`fetch(\`\${API_BASE_URL}/recipes\``, `fetch(\`\${API_BASE_URL}/recipes/\${id}\``);
content = content.replace(`method: 'POST',`, `method: 'PUT',`);

fs.writeFileSync(editPath, content);
console.log("Successfully transformed create.tsx into edit/[id].tsx");
