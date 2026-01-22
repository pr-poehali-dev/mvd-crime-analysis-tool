import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_URLS = {
  legislation: 'https://functions.poehali.dev/7c589562-40cd-4ff0-af36-027a834a4296',
  auth: 'https://functions.poehali.dev/8e21a310-11ee-4b56-8199-850b5fbf89e8',
  analysis: 'https://functions.poehali.dev/3d7c7265-98c8-4c18-ada1-80156838fa47'
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [activeModule, setActiveModule] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [ukRfArticles, setUkRfArticles] = useState([]);
  const [upkRfArticles, setUpkRfArticles] = useState([]);
  const [constitutionArticles, setConstitutionArticles] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');

  const modules = [
    { id: 'dashboard', name: 'Главная панель', icon: 'LayoutDashboard' },
    { id: 'analysis', name: 'Анализ преступления', icon: 'FileSearch' },
    { id: 'database', name: 'База законодательства', icon: 'BookOpen' },
    { id: 'reports', name: 'Отчёты', icon: 'BarChart3' },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('mvd_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLegislation();
      loadAnalyses();
    }
  }, [isAuthenticated]);

  const loadLegislation = async () => {
    try {
      const [ukRes, upkRes, constRes] = await Promise.all([
        fetch(`${API_URLS.legislation}?type=uk_rf`),
        fetch(`${API_URLS.legislation}?type=upk_rf`),
        fetch(`${API_URLS.legislation}?type=constitution`)
      ]);
      
      const ukData = await ukRes.json();
      const upkData = await upkRes.json();
      const constData = await constRes.json();
      
      setUkRfArticles(ukData.data.map((a: any) => ({ 
        num: a.article_number, 
        title: a.title, 
        category: a.category, 
        severity: a.severity 
      })));
      setUpkRfArticles(upkData.data.map((a: any) => ({ 
        num: a.article_number, 
        title: a.title, 
        category: a.category 
      })));
      setConstitutionArticles(constData.data.map((a: any) => ({ 
        num: a.article_number, 
        title: a.title, 
        category: a.category 
      })));
    } catch (error) {
      console.error('Ошибка загрузки законодательства:', error);
    }
  };

  const loadAnalyses = async () => {
    try {
      const res = await fetch(API_URLS.analysis);
      const data = await res.json();
      setRecentAnalyses(data.data.slice(0, 3).map((a: any) => ({
        id: a.id,
        date: new Date(a.created_at).toLocaleDateString('ru-RU'),
        type: `${a.category} (дело ${a.case_number})`,
        status: a.status === 'completed' ? 'Завершён' : 'В обработке',
        officer: a.officer_name || 'Неизвестно'
      })));
    } catch (error) {
      console.error('Ошибка загрузки анализов:', error);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const caseNumber = (document.getElementById('case-number') as HTMLInputElement)?.value;
      const date = (document.getElementById('date') as HTMLInputElement)?.value;
      const category = 'Преступления против собственности';
      const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;
      const evidence = (document.getElementById('evidence') as HTMLTextAreaElement)?.value;

      const res = await fetch(API_URLS.analysis, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_number: caseNumber,
          incident_date: date,
          category,
          description,
          evidence,
          officer_id: 1
        })
      });

      const data = await res.json();
      
      if (data.success) {
        const result = data.data.analysis_result;
        const articlesText = result.article_details && result.article_details.length > 0
          ? result.article_details.slice(0, 3).map((a: any) => `${a.number} - ${a.title}`).join('; ')
          : result.suggested_articles.slice(0, 5).join(', ');
        
        toast.success('Анализ завершён успешно!', {
          description: `Найдено статей: ${result.total_found || result.suggested_articles.length}. Применимые статьи: ${articlesText}`,
          duration: 8000
        });
        loadAnalyses();
      } else {
        toast.error('Ошибка анализа', { description: data.error });
      }
    } catch (error) {
      toast.error('Ошибка', { description: 'Не удалось выполнить анализ' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Отчёт формируется', {
      description: 'Файл будет готов через несколько секунд'
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('mvd_user', JSON.stringify(data.data.user));
        localStorage.setItem('mvd_token', data.data.token);
        toast.success('Добро пожаловать!', {
          description: `${data.data.user.rank} ${data.data.user.full_name}`
        });
      } else {
        toast.error('Ошибка входа', { description: data.error });
      }
    } catch (error) {
      toast.error('Ошибка', { description: 'Не удалось выполнить вход' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('mvd_user');
    localStorage.removeItem('mvd_token');
    toast.info('Вы вышли из системы');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Icon name="Shield" size={40} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">МВД России</CardTitle>
              <CardDescription className="text-base mt-2">
                Система автоматизированного анализа преступлений
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  placeholder="Введите логин"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <Icon name="LogIn" size={20} className="mr-2" />
                {loading ? 'Вход...' : 'Войти в систему'}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-700 font-semibold mb-2">Тестовый доступ:</p>
              <p className="text-xs text-slate-600">Если не можете войти, создайте нового пользователя:</p>
              <p className="text-xs text-slate-600">Логин: test / Пароль: test123</p>
              <Button 
                onClick={async () => {
                  try {
                    const res = await fetch(API_URLS.auth, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'register',
                        username: 'testuser',
                        password: 'test123',
                        full_name: 'Тестовый Пользователь',
                        rank: 'Капитан',
                        department: 'Отдел тестирования'
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success('Пользователь создан!', { description: 'Войдите как testuser / test123' });
                    } else {
                      toast.error('Ошибка', { description: data.error });
                    }
                  } catch (e) {
                    toast.error('Ошибка создания пользователя');
                  }
                }}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                Создать тестового пользователя
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <aside className="w-72 min-h-screen bg-secondary text-white p-6 shadow-xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <Icon name="Shield" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">МВД России</h1>
                <p className="text-xs text-slate-300">Система анализа</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeModule === module.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-300 hover:bg-secondary/80 hover:text-white'
                }`}
              >
                <Icon name={module.icon} size={20} />
                <span className="font-medium">{module.name}</span>
              </button>
            ))}
          </nav>

          <Separator className="my-6 bg-slate-600" />

          <div className="space-y-3 mb-4">
            <div className="px-4 py-3 bg-secondary/80 rounded-lg">
              <p className="text-xs text-slate-400">Вы вошли как:</p>
              <p className="text-sm font-semibold text-white">{currentUser?.rank}</p>
              <p className="text-sm text-slate-300">{currentUser?.full_name}</p>
              <Badge variant="outline" className="mt-2 text-xs">{currentUser?.role === 'admin' ? 'Администратор' : 'Сотрудник'}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-secondary/80 hover:text-white transition-all">
              <Icon name="Settings" size={20} />
              <span className="font-medium">Настройки</span>
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all">
              <Icon name="LogOut" size={20} />
              <span className="font-medium">Выход</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">Главная панель</h2>
                  <p className="text-slate-600">Система автоматизированного анализа преступлений</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="hover-scale cursor-pointer border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon name="FileSearch" size={32} className="text-primary" />
                        <Badge variant="secondary">24</Badge>
                      </div>
                      <CardTitle className="text-xl">Анализов за день</CardTitle>
                      <CardDescription>Обработано материалов</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover-scale cursor-pointer border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon name="BookOpen" size={32} className="text-green-600" />
                        <Badge variant="secondary">1847</Badge>
                      </div>
                      <CardTitle className="text-xl">Статей в базе</CardTitle>
                      <CardDescription>УК РФ, УПК РФ, Конституция</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="hover-scale cursor-pointer border-l-4 border-l-orange-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon name="BarChart3" size={32} className="text-orange-600" />
                        <Badge variant="secondary">156</Badge>
                      </div>
                      <CardTitle className="text-xl">Отчётов создано</CardTitle>
                      <CardDescription>За текущий месяц</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Clock" size={20} />
                      Последние анализы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentAnalyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-secondary">{analysis.type}</p>
                            <p className="text-sm text-slate-600">Сотрудник: {analysis.officer}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">{analysis.date}</span>
                            <Badge variant={analysis.status === 'Завершён' ? 'default' : 'secondary'}>
                              {analysis.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeModule === 'analysis' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">Анализ преступления</h2>
                  <p className="text-slate-600">Автоматизированная классификация и квалификация</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Данные о преступлении</CardTitle>
                    <CardDescription>Заполните форму для проведения анализа</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="case-number">Номер дела</Label>
                        <Input id="case-number" placeholder="Введите номер дела" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Дата происшествия</Label>
                        <Input id="date" type="date" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Категория преступления</Label>
                      <Select>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property">Преступления против собственности</SelectItem>
                          <SelectItem value="life">Преступления против жизни и здоровья</SelectItem>
                          <SelectItem value="public">Преступления против общественной безопасности</SelectItem>
                          <SelectItem value="economic">Преступления в сфере экономики</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Загрузить документ (опционально)</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedFile(file);
                              setLoading(true);
                              try {
                                const reader = new FileReader();
                                reader.onload = async (ev) => {
                                  const base64 = ev.target?.result?.toString().split(',')[1];
                                  const res = await fetch(`${API_URLS.analysis}?action=parse`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      file_data: base64,
                                      file_name: file.name
                                    })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setExtractedText(data.data.text);
                                    (document.getElementById('description') as HTMLTextAreaElement).value = data.data.text;
                                    toast.success('Документ обработан!', {
                                      description: `Извлечено ${data.data.text.length} символов`
                                    });
                                  } else {
                                    toast.error('Ошибка обработки документа', { description: data.error });
                                  }
                                };
                                reader.readAsDataURL(file);
                              } catch (error) {
                                toast.error('Ошибка загрузки файла');
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          {uploadedFile ? (
                            <>
                              <Icon name="FileCheck" size={40} className="text-green-600" />
                              <p className="text-sm font-semibold text-secondary">{uploadedFile.name}</p>
                              <p className="text-xs text-slate-500">Нажмите, чтобы выбрать другой файл</p>
                            </>
                          ) : (
                            <>
                              <Icon name="Upload" size={40} className="text-slate-400" />
                              <p className="text-sm font-semibold text-secondary">Загрузите документ</p>
                              <p className="text-xs text-slate-500">PDF, Word, TXT</p>
                              <p className="text-xs text-slate-400 mt-1">Текст автоматически заполнит поле ниже</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Описание обстоятельств</Label>
                      <Textarea
                        id="description"
                        placeholder="Подробное описание события преступления, обстоятельств, лиц, участвовавших в деянии..."
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evidence">Доказательства</Label>
                      <Textarea
                        id="evidence"
                        placeholder="Перечислите имеющиеся доказательства, показания свидетелей, вещественные доказательства..."
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleAnalyze} className="w-full" size="lg" disabled={loading}>
                      <Icon name="Search" size={20} className="mr-2" />
                      {loading ? 'Анализирую...' : 'Провести анализ'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeModule === 'database' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">База законодательства РФ</h2>
                  <p className="text-slate-600">Актуальная редакция кодексов с функцией поиска</p>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Поиск по номеру статьи или ключевым словам..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button variant="outline">
                        <Icon name="Filter" size={20} className="mr-2" />
                        Фильтры
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="uk">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="uk">УК РФ</TabsTrigger>
                        <TabsTrigger value="upk">УПК РФ</TabsTrigger>
                        <TabsTrigger value="const">Конституция РФ</TabsTrigger>
                      </TabsList>

                      <TabsContent value="uk" className="space-y-4">
                        <ScrollArea className="h-[500px] pr-4">
                          {ukRfArticles.map((article) => (
                            <Card key={article.num} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="font-mono">
                                        Ст. {article.num}
                                      </Badge>
                                      <Badge variant={article.severity === 'Особо тяжкое' ? 'destructive' : 'secondary'}>
                                        {article.severity}
                                      </Badge>
                                    </div>
                                    <CardTitle className="text-lg">{article.title}</CardTitle>
                                    <CardDescription className="mt-1">{article.category}</CardDescription>
                                  </div>
                                  <Icon name="ChevronRight" size={20} className="text-slate-400 mt-1" />
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="upk" className="space-y-4">
                        <ScrollArea className="h-[500px] pr-4">
                          {upkRfArticles.map((article) => (
                            <Card key={article.num} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Badge variant="outline" className="font-mono mb-2">
                                      Ст. {article.num}
                                    </Badge>
                                    <CardTitle className="text-lg">{article.title}</CardTitle>
                                    <CardDescription className="mt-1">{article.category}</CardDescription>
                                  </div>
                                  <Icon name="ChevronRight" size={20} className="text-slate-400 mt-1" />
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="const" className="space-y-4">
                        <ScrollArea className="h-[500px] pr-4">
                          {constitutionArticles.map((article) => (
                            <Card key={article.num} className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Badge variant="outline" className="font-mono mb-2">
                                      Ст. {article.num}
                                    </Badge>
                                    <CardTitle className="text-lg">{article.title}</CardTitle>
                                    <CardDescription className="mt-1">{article.category}</CardDescription>
                                  </div>
                                  <Icon name="ChevronRight" size={20} className="text-slate-400 mt-1" />
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon name="RefreshCw" size={24} className="text-primary" />
                      <div>
                        <CardTitle>Автоматическое обновление</CardTitle>
                        <CardDescription className="text-slate-700">
                          Последнее обновление: 15.01.2026 | Следующее: 01.02.2026
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            )}

            {activeModule === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">Формирование отчётов</h2>
                  <p className="text-slate-600">Аналитика и статистика по проведённым анализам</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика по категориям</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Против собственности</span>
                            <span className="font-semibold">42%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '42%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Против жизни и здоровья</span>
                            <span className="font-semibold">28%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '28%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Экономические преступления</span>
                            <span className="font-semibold">18%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '18%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Прочие</span>
                            <span className="font-semibold">12%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: '12%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Динамика по месяцам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-end justify-between gap-2 h-32">
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '45%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '62%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '55%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '78%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '85%' }}></div>
                          <div className="flex-1 bg-primary rounded-t" style={{ height: '100%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Авг</span>
                          <span>Сен</span>
                          <span>Окт</span>
                          <span>Ноя</span>
                          <span>Дек</span>
                          <span>Янв</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Экспорт отчётов</CardTitle>
                    <CardDescription>Выберите формат для выгрузки данных</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button onClick={handleExport} variant="outline" className="h-24 flex flex-col gap-2">
                        <Icon name="FileText" size={32} className="text-primary" />
                        <span>PDF отчёт</span>
                      </Button>
                      <Button onClick={handleExport} variant="outline" className="h-24 flex flex-col gap-2">
                        <Icon name="FileSpreadsheet" size={32} className="text-green-600" />
                        <span>Excel таблица</span>
                      </Button>
                      <Button onClick={handleExport} variant="outline" className="h-24 flex flex-col gap-2">
                        <Icon name="Database" size={32} className="text-orange-600" />
                        <span>Данные JSON</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;