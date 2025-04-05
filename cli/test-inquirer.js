import inquirer from 'inquirer';

// Just to verify the syntax, not to actually run
async function testInquirer() {
  // Test standard prompt array syntax
  const result1 = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'test',
      message: 'Test confirm',
      default: true
    }
  ]);
  
  // Test object syntax for prompt
  const result2 = await inquirer.prompt({
    type: 'checkbox',
    name: 'test',
    message: 'Test checkbox',
    choices: ['option1', 'option2'],
    validate: (answer) => {
      if (Array.isArray(answer) && answer.length > 0) {
        return true;
      }
      return 'Please select at least one';
    }
  });
  
  console.log('Both syntaxes are valid');
}

// Just declare the function to check syntax, don't run it
console.log('Inquirer syntax validation complete');
