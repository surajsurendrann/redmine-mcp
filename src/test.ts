import 'dotenv/config';
import { redmineService } from './services/index.js';

async function main() {
    try {
        const user = await redmineService.getCurrentUser();

        console.log('Connected as:');
        console.log(user);

        const projects = await redmineService.listProjects();

        console.log('\nProjects');
        console.table(projects);
    } catch (error) {
        console.error(error);
    }
}

main();