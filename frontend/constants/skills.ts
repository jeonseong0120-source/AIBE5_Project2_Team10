export interface SkillCategory {
    id: string;
    label: string;
    skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        id: 'backend',
        label: 'Backend',
        skills: [
            'Java', 'Spring Boot', 'Node.js', 'Python', 'Kotlin', 'Go', 
            'Redis', 'GraphQL', 'Django', 'FastAPI', 'Express.js', 'NestJS', 
            'gRPC', 'Firebase', 'OAuth2', 'Spring Security', 'JPA', 'Querydsl', 
            'Caching', 'WebSocket'
        ]
    },
    {
        id: 'frontend',
        label: 'Frontend',
        skills: [
            'React', 'Next.js', 'TypeScript', 'Vue.js', 'Angular', 
            'Tailwind CSS', 'Sass', 'Webpack', 'Vite', 'Storybook', 'JavaScript'
        ]
    },
    {
        id: 'mobile',
        label: 'Mobile',
        skills: [
            'Swift', 'Flutter', 'React Native'
        ]
    },
    {
        id: 'cloud-data',
        label: 'Cloud & Data',
        skills: [
            'AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 
            'GitHub Actions', 'Linux', 'Nginx', 'PostgreSQL', 'MySQL', 
            'MongoDB', 'Elasticsearch', 'Database Sharding', 'Apache Kafka', 
            'Apache Spark', 'Matching Algorithm'
        ]
    },
    {
        id: 'etc',
        label: 'Etc',
        skills: [
            'MSA', 'SOLID', 'Figma', 'Jest', 'Cypress', 'Solidity'
        ]
    }
];
